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
                                                         (select-keys [:id :email :name :organization :role :created-at :email-verified])) users)}))}}]

    ["/admin/activity-logs" {:get {:summary "Get activity logs (admin only)"
                                   :interceptors [(auth/restrict-role-interceptor :ADMIN)]
                                   :parameters {:query [:map
                                                        [:limit {:optional true} :int]
                                                        [:type {:optional true} :string]
                                                        [:user-email {:optional true} :string]
                                                        [:from {:optional true} :string]
                                                        [:to {:optional true} :string]]}
                                   :responses {200 {:body :any}
                                               401 {:body :any}}
                                   :handler (fn [{:keys [parameters]}]
                                             (let [query-params (:query parameters)
                                                   logs (activity/get-activity-logs query-params)]
                                               {:status 200
                                                :body {:logs logs
                                                       :stats (activity/get-stats)}}))}}]

    ["/referentiels" {:get {:summary "Get all referentiels"
                            :responses {200 {:body :any}}
                            :interceptors [core/get-all-referentiels-interceptor]
                            :handler (fn [{:keys [aicn/all-referentiels]}]
                                       {:status 200
                                        :body all-referentiels})}}]
    #_["/lov" {:get {:summary "Get all lov"
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
                                           (activity/add-activity-log! {:type :conversation-created
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
                                                                     (activity/add-activity-log! {:type :message-sent
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
