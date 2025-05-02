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
    ["/referentiels" {:get {:summary "Get all referentiels"
                            :responses {200 {:body :any}}
                            :interceptors [core/get-all-referentiels-interceptor]
                            :handler (fn [{:keys [aicn/all-referentiels]}]
                                       {:status 200
                                        :body all-referentiels})}}]]])
