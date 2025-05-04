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
              (airtable/sync-tables (:adapter/airtable ctx) (airtable/get-tables-names))
              ctx
              (catch Exception e
                (let [error-details {:message (.getMessage e)
                                     :class (str (.getClass e))
                                     :cause (when-let [cause (.getCause e)]
                                              (.getMessage cause))}]
                  (logger/error e)
                  (-> ctx
                      (assoc :response {:status 500 :body {:error error-details}})
                      (assoc :queue nil))))))})

(def get-all-referentiels-interceptor
  {:enter (fn [ctx]
            (let [referentiels (airtable/get-all-referentiels)]
              (assoc-in ctx [:request :aicn/all-referentiels] referentiels)))})

