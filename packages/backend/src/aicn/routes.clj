(ns aicn.routes
  (:require
   [aicn.auth :as auth]
   [aicn.core :as core]
   [aicn.db :as db]
   [aicn.model :as model]
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
   ["" {:interceptors [auth/authentication-interceptor
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
                                                        :body {:unreadCount count}}))}}]]])
