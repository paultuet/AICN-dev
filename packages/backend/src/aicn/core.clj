(ns aicn.core
  (:require
   [aicn.adapters.airtable :as airtable]
   [aicn.logger :as logger]))

(defn init-system-interceptor [system]
  {:enter (fn [ctx]
            (update ctx :request merge system))})

(def sync-referentiels-from-airtable-interceptor
  {:enter (fn [ctx]
            (try
              (airtable/sync-tables (get-in ctx [:request :adapter/airtable]) (airtable/get-tables-names))
              ctx
              (catch Exception e
                (let [error-details {:message (.getMessage e)
                                     :class (str (.getClass e))
                                     :cause (when-let [cause (.getCause e)]
                                              (.getMessage cause))
                                     :data (ex-data e)}]
                  (logger/error (str "Sync error: " (.getMessage e)
                                     (when-let [c (.getCause e)]
                                       (str " | Cause: " (.getMessage c)))))
                  (.printStackTrace e)
                  (-> ctx
                      (assoc :response {:status 500 :body {:error error-details}})
                      (assoc :queue nil))))))})

(def get-all-referentiels-interceptor
  {:enter (fn [ctx]
            (let [referentiels (airtable/get-all-referentiels)]
              (assoc-in ctx [:request :aicn/all-referentiels] referentiels)))})


(def get-all-lov-new-interceptor
  {:enter (fn [ctx]
            (let [lov-new (airtable/get-all-lov-new)]
              (assoc-in ctx [:request :aicn/all-lov-new] lov-new)))})
