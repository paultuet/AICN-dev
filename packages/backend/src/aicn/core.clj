(ns aicn.core
  (:require
   [aicn.adapters.airtable :as airtable]))

(defn init-system-interceptor [system]
  {:enter (fn [ctx]
            (update ctx :request merge system))})

(def get-all-referentiels-interceptor
  {:enter (fn [ctx]
            (let [referentiels (airtable/get-all-referentiels)]
              (assoc-in ctx [:request :aicn/all-referentiels] referentiels)))})

