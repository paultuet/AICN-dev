(ns aicn.http-client
  (:require
   [hato.client :as hc]
   [aicn.utils :as u]))

(defn execute-http-request [{:keys [base-url] :as _config} {:keys [path method data headers]}]
  (-> (hc/request {:url (str base-url path)
                   :method method
                   :headers (merge {"Content-Type" "application/json"} headers)
                   :body (u/to-json data)
                   :as :json
                   :throw-exceptions false})
      :body))
