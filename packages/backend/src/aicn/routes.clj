(ns aicn.routes
  (:require
   [aicn.auth :as auth]
   [aicn.core :as core]
   [aicn.db :as db]
   [aicn.model :as model]
   [malli.util :as mu]
   [ring.util.response :as response]))

;; Table CRUD handlers
(defn get-all-tables-handler [request]
  (let [system (:system request)
        datasource (get-in system [:db/pg :ds])]
    (response/response [])))


(defn health-check-handler [_]
  (response/response {:status "ok"
                      :timestamp (str (java.time.Instant/now))}))

(defn get-api-routes [opts]
  ["" {:interceptors [(core/init-system-interceptor opts)]}
   
   ;; Public endpoint that doesn't require authentication
   ["/health" {:get {:summary "Health check endpoint"
                     :responses {200 {:body :any}}
                     :handler health-check-handler}}]
   
   ;; Protected routes requiring authentication
   ["" {:interceptors [auth/authentication-interceptor
                       auth/authorization-interceptor]}
    ["/referentiels" {:get {:summary "Get all referentiels"
                            :responses {200 {:body :any}}
                            :interceptors [core/get-all-referentiels-interceptor]
                            :handler (fn [{:keys [aicn/all-referentiels]}]
                                       {:status 200
                                        :body all-referentiels})}}]
    ["/tables" {:get {:summary "Get tables"
                      :responses {200 {:body :any}}
                      :handler get-all-tables-handler}}]]])
