(ns aicn.routes
  (:require
   [aicn.activity-logs :as activity]
   [aicn.auth :as auth]
   [aicn.core :as core]
   [aicn.db :as db]
   [aicn.files :as files]
   [aicn.logger :as log]
   [aicn.model :as model]
   [clojure.set]
   [java-time.api :as time]
   [malli.util :as mu]
   [ring.util.response :as response]))

(defn health-check-handler [_]
  (response/response {:status "ok"
                      :timestamp (str (java.time.Instant/now))}))

(def ^:private telemetry-event-allowlist
  "Whitelist of frontend telemetry events. New events must be added here explicitly
   to prevent abuse / log noise. Names: lowercase-kebab."
  #{"register-page-viewed"
    "register-submit-clicked"
    "register-validation-failed"
    "register-request-sent"
    "register-request-success"
    "register-request-error"
    "login-page-viewed"
    "login-submit-clicked"
    "login-request-sent"
    "login-request-success"
    "login-request-error"
    "forgot-password-page-viewed"
    "forgot-password-submit-clicked"
    "forgot-password-request-sent"
    "forgot-password-request-success"
    "forgot-password-request-error"})

(defn telemetry-handler
  "Public endpoint that records frontend telemetry events into activity_logs.
   Best-effort: a write failure must never surface to the user."
  [request]
  (let [ds (get-in request [:db/ds])
        body (get-in request [:parameters :body])
        event (:event body)
        details (:details body)
        user-agent (get-in request [:headers "user-agent"])
        ip (or (get-in request [:headers "x-forwarded-for"])
               (get-in request [:headers "fly-client-ip"])
               (str (:remote-addr request)))]
    (cond
      (or (nil? event) (not (string? event)))
      {:status 400 :body {:error "Invalid event"}}

      (not (contains? telemetry-event-allowlist event))
      {:status 400 :body {:error "Unknown event"}}

      :else
      (do
        (try
          (activity/add-activity-log!
           ds {:type (str "telemetry/" event)
               :user-email (when (map? details) (:email details))
               :user-name nil
               :user-id nil
               :message (str "Frontend telemetry: " event)
               :details (merge {:user-agent user-agent
                                :ip ip}
                               (when (map? details) details))})
          (catch Exception e
            (log/error (str "Telemetry write failed - event: " event
                            " - error: " (.getMessage e)))))
        {:status 204 :body nil}))))

;; Feature Flags handler
(defn get-feature-flags-handler [request]
  (let [datasource (get-in request [:db/ds])
        feature-flags (db/get-all-feature-flags datasource)]
    (response/response feature-flags)))

(defn get-api-routes [opts]
  (let [jwt-config (:auth/jwt opts)]
    ["" {:interceptors [(core/init-system-interceptor opts)]}

     ;; Public endpoint that doesn't require authentication
     ["/health" {:get {:summary "Health check endpoint"
                       :responses {200 {:body :any}}
                       :handler health-check-handler}}]

     ;; Feature flags public endpoint
     ["/feature-flags" {:get {:summary "Get all feature flags"
                              :responses {200 {:body :any}}
                              :handler get-feature-flags-handler}}]

     ;; Public frontend telemetry endpoint
     ["/telemetry" {:post {:summary "Record a frontend telemetry event"
                           :parameters {:body [:map
                                               [:event :string]
                                               [:details {:optional true} :any]]}
                           :responses {204 {:body :any}
                                       400 {:body :any}}
                           :handler telemetry-handler}}]

     ;; Protected routes requiring authentication
     ["" {:interceptors [(auth/authentication-interceptor jwt-config)
                         auth/authorization-interceptor]}
    ["/sync" {:post {:summary "Sync from airtable"
                     :interceptors [(auth/restrict-role-interceptor :ADMIN)
                                    core/sync-referentiels-from-airtable-interceptor
                                    core/get-all-referentiels-interceptor]
                     :responses {200 {:body :any}
                                 401 {:body :any}}
                     :handler (fn [{:keys [aicn/all-referentiels]}]
                                {:status 200
                                 :body all-referentiels})}}]

    ["/admin/users" {:get {:summary "Get all users (admin only)"
                           :interceptors [(auth/restrict-role-interceptor :ADMIN)]
                           :responses {200 {:body :any}
                                       401 {:body :any}}
                           :handler (fn [{:keys [db/ds]}]
                                      (let [users (db/get-all-users ds)]
                                        {:status 200
                                         :body (map #(-> %
                                                         (select-keys [:id :email :name :organization :role :created-at :email-verified :approved])) users)}))}}]

    ["/admin/users/:id/approve" {:post {:summary "Approve a user (admin only)"
                                        :interceptors [(auth/restrict-role-interceptor :ADMIN)]
                                        :parameters {:path [:map [:id :string]]}
                                        :responses {200 {:body :any}
                                                    400 {:body :any}
                                                    401 {:body :any}
                                                    404 {:body :any}}
                                        :handler (fn [request]
                                                   (auth/approve-user request))}}]

    ["/admin/activity-logs" {:get {:summary "Get activity logs (admin only)"
                                   :interceptors [(auth/restrict-role-interceptor :ADMIN)]
                                   :parameters {:query [:map
                                                        [:limit {:optional true} :int]
                                                        [:offset {:optional true} :int]
                                                        [:type {:optional true} :string]
                                                        [:user-email {:optional true} :string]
                                                        [:from {:optional true} :string]
                                                        [:to {:optional true} :string]]}
                                   :responses {200 {:body :any}
                                               401 {:body :any}}
                                   :handler (fn [{:keys [parameters db/ds]}]
                                             (let [query-params (:query parameters)
                                                   logs (activity/get-activity-logs ds query-params)
                                                   total (activity/count-activity-logs ds query-params)]
                                               {:status 200
                                                :body {:logs logs
                                                       :total total
                                                       :stats (activity/get-stats ds)}}))}}]

    ["/lov-new" {:get {:summary "Get all lov_new entries"
                       :responses {200 {:body :any}}
                       :interceptors [core/get-all-lov-new-interceptor]
                       :handler (fn [{:keys [aicn/all-lov-new]}]
                                  {:status 200
                                   :body all-lov-new})}}]

    ["/referentiels" {:get {:summary "Get all referentiels"
                            :responses {200 {:body :any}}
                            :interceptors [core/get-all-referentiels-interceptor]
                            :handler (fn [{:keys [aicn/all-referentiels]}]
                                       {:status 200
                                        :body all-referentiels})}}]
    ;; Conversations endpoints
    ["/conversations" {:get {:summary "Get all conversations"
                             :responses {200 {:body :any}}
                             :handler (fn [{:keys [db/ds session/user]}]
                                        (let [user-id (:id user)
                                              conversations (db/get-conversations-with-messages ds user-id)]

                                          {:status 200
                                           :body {:conversations (map (fn [conv]
                                                                        {:id (:id conv)
                                                                         :title (:title conv)
                                                                         :createdAt (:created_at conv)
                                                                         :lastActivity (:last_activity conv)
                                                                         :messageCount (:message_count conv)
                                                                         :linkedItems (:linked_items conv)
                                                                         :messages (:messages conv)
                                                                         :readStatus {:isRead (boolean (:is_read conv))
                                                                                      :lastReadAt (:last_read_at conv)}})
                                                                      conversations)}}))}
                       :post {:summary "Create a new conversation"
                              :responses {200 {:body :any}
                                          400 {:body :any}}
                              :handler (fn [{:keys [body-params db/ds session/user]}]
                                         (let [{:keys [title linkedItems]} body-params
                                               conversation-id (str (java.util.UUID/randomUUID))
                                               user-id (:id user)
                                               user-email (:email user)
                                               user-name (:name user)
                                               created-conv (db/create-conversation ds {:id conversation-id
                                                                                        :title title
                                                                                        :linked-items linkedItems
                                                                                        :created-by user-id})
                                               new-conversation {:id (:id created-conv)
                                                                 :title (:title created-conv)
                                                                 :createdAt (:created_at created-conv)
                                                                 :lastActivity (:last_activity created-conv)
                                                                 :messageCount (:message_count created-conv)
                                                                 :linkedItems (:linked_items created-conv)
                                                                 :messages []}]
                                           (log/info (str "Conversation created - User: " user-email
                                                         " - Name: " user-name
                                                         " - Conversation ID: " conversation-id
                                                         " - Title: " title
                                                         " - Time: " (time/instant)))
                                           (activity/add-activity-log! ds {:type :conversation-created
                                                                           :user-email user-email
                                                                           :user-name user-name
                                                                           :user-id user-id
                                                                           :message "Conversation created"
                                                                           :details {:conversation-id conversation-id
                                                                                     :title title
                                                                                     :linked-items linkedItems}})
                                           {:status 200
                                            :body new-conversation}))}}]

    ["/conversations/:conversation-id/messages" {:post {:summary "Send a message to a conversation"
                                                        :responses {200 {:body :any}
                                                                    404 {:body :any}}
                                                        :handler (fn [{:keys [path-params body-params db/ds]}]
                                                                   (let [{:keys [conversation-id]} path-params
                                                                         {:keys [content userId userFullName]} body-params
                                                                         message-id (str "m" (System/currentTimeMillis))
                                                                         created-msg (db/create-message ds {:id message-id
                                                                                                            :conversation-id conversation-id
                                                                                                            :content content
                                                                                                            :author-id userId
                                                                                                            :author-name userFullName})
                                                                         new-message {:id (:id created-msg)
                                                                                      :conversationId (:conversation_id created-msg)
                                                                                      :content (:content created-msg)
                                                                                      :createdAt (:created_at created-msg)
                                                                                      :authorId (:author_id created-msg)
                                                                                      :authorName (:author_name created-msg)}]
                                                                     (log/info (str "Message added to conversation - User ID: " userId
                                                                                   " - User Name: " userFullName
                                                                                   " - Conversation ID: " conversation-id
                                                                                   " - Message ID: " message-id
                                                                                   " - Time: " (time/instant)))
                                                                     (activity/add-activity-log! ds {:type :message-sent
                                                                                                     :user-email nil
                                                                                                     :user-name userFullName
                                                                                                     :user-id userId
                                                                                                     :message "Message sent to conversation"
                                                                                                     :details {:conversation-id conversation-id
                                                                                                               :message-id message-id
                                                                                                               :content-preview (subs content 0 (min 50 (count content)))}})
                                                                     {:status 200
                                                                      :body new-message}))}}]

    ;; Read status endpoints
    ["/conversations/:conversation-id/read" {:put {:summary "Mark conversation as read"
                                                   :responses {200 {:body :any}
                                                               404 {:body :any}}
                                                   :handler (fn [{:keys [path-params db/ds session/user]}]
                                                              (let [{:keys [conversation-id]} path-params
                                                                    user-id (:id user)
                                                                    read-status (db/mark-conversation-as-read ds conversation-id user-id)]
                                                                {:status 200
                                                                 :body {:readStatus {:isRead (:is-read read-status)
                                                                                     :lastReadAt (:last-read-at read-status)}}}))}
                                             :delete {:summary "Mark conversation as unread"
                                                      :responses {200 {:body :any}
                                                                  404 {:body :any}}
                                                      :handler (fn [{:keys [path-params db/ds session/user]}]
                                                                 (let [{:keys [conversation-id]} path-params
                                                                       user-id (:id user)
                                                                       read-status (db/mark-conversation-as-unread ds conversation-id user-id)]
                                                                   {:status 200
                                                                    :body {:readStatus {:isRead (:is-read read-status)
                                                                                        :lastReadAt (:last-read-at read-status)}}}))}}]

    ["/conversations/unread-count" {:get {:summary "Get count of unread conversations"
                                          :responses {200 {:body :any}}
                                          :handler (fn [{:keys [db/ds session/user]}]
                                                     (let [user-id (:id user)
                                                           count (db/get-unread-conversations-count ds user-id)]
                                                       {:status 200
                                                        :body {:unreadCount count}}))}}]

    ;; Comments endpoints
    ["/comments/counts" {:conflicting true
                         :get {:summary "Get comment counts for all targets"
                               :responses {200 {:body :any}}
                               :handler (fn [{:keys [db/ds]}]
                                          (let [counts (db/get-comment-counts ds)]
                                            {:status 200
                                             :body {:counts (map (fn [c]
                                                                   {:targetType (:target_type c)
                                                                    :targetId (:target_id c)
                                                                    :count (:count c)})
                                                                 counts)}}))}}]

    ["/comments/:target-type/:target-id" {:get {:summary "Get comments for a specific target"
                                                 :responses {200 {:body :any}}
                                                 :handler (fn [{:keys [path-params db/ds]}]
                                                            (let [{:keys [target-type target-id]} path-params
                                                                  comments (db/get-comments-for-target ds target-type target-id)]
                                                              {:status 200
                                                               :body {:comments (map (fn [c]
                                                                                       {:id (:id c)
                                                                                        :targetType (:target_type c)
                                                                                        :targetId (:target_id c)
                                                                                        :content (:content c)
                                                                                        :authorId (:author_id c)
                                                                                        :authorName (:author_name c)
                                                                                        :createdAt (:created_at c)})
                                                                                     comments)}}))}}]

    ["/comments" {:post {:summary "Add a comment to a target"
                         :responses {200 {:body :any}
                                     400 {:body :any}}
                         :handler (fn [{:keys [body-params db/ds session/user]}]
                                    (let [{:keys [targetType targetId content]} body-params
                                          user-id (:id user)
                                          user-name (:name user)
                                          user-email (:email user)]
                                      (if (or (empty? content) (empty? targetType) (empty? targetId))
                                        {:status 400
                                         :body {:error "targetType, targetId and content are required"}}
                                        (let [comment (db/create-comment ds {:target-type targetType
                                                                             :target-id targetId
                                                                             :content content
                                                                             :author-id user-id
                                                                             :author-name user-name})]
                                          (activity/add-activity-log! ds {:type :comment-added
                                                                          :user-email user-email
                                                                          :user-name user-name
                                                                          :user-id user-id
                                                                          :message "Comment added"
                                                                          :details {:target-type targetType
                                                                                    :target-id targetId
                                                                                    :content-preview (subs content 0 (min 50 (count content)))}})
                                          {:status 200
                                           :body {:id (:id comment)
                                                  :targetType (:target-type comment)
                                                  :targetId (:target-id comment)
                                                  :content (:content comment)
                                                  :authorId (:author-id comment)
                                                  :authorName (:author-name comment)
                                                  :createdAt (:created-at comment)}}))))}}]

    ["/comments/:comment-id" {:conflicting true
                              :delete {:summary "Delete own comment"
                                        :responses {200 {:body :any}
                                                    404 {:body :any}}
                                        :handler (fn [{:keys [path-params db/ds session/user]}]
                                                   (let [comment-id (:comment-id path-params)
                                                         user-id (:id user)
                                                         deleted (db/delete-comment ds comment-id user-id)]
                                                     (if deleted
                                                       {:status 200
                                                        :body {:deleted true}}
                                                       {:status 404
                                                        :body {:error "Comment not found or not owned by you"}})))}}]

    ;; File management endpoints
    ["/file/upload" {:post {:summary "Upload a file (admin only)"
                            :interceptors [(auth/restrict-role-interceptor :ADMIN)]
                            :parameters {:multipart :any}
                            :responses {200 {:body :any}
                                        401 {:body :any}}
                            :handler files/upload-file-handler}}]

    ["/file/current" {:get {:summary "Get current uploaded file"
                            :responses {200 {:body :any}
                                        404 {:body :any}}
                            :handler files/get-current-file-handler}}]

    ["/files" {:get {:summary "Get all uploaded files"
                     :responses {200 {:body :any}}
                     :handler files/get-all-files-handler}}]

    ["/file/download/:file-id" {:get {:summary "Download a file"
                                      :responses {200 {:body :any}
                                                  404 {:body :any}}
                                      :handler files/download-file-handler}}]

    ["/file/delete/:file-id" {:delete {:summary "Delete a file (admin only)"
                                       :interceptors [(auth/restrict-role-interceptor :ADMIN)]
                                       :responses {200 {:body :any}
                                                   401 {:body :any}
                                                   404 {:body :any}}
                                       :handler files/delete-file-handler}}]]]))
