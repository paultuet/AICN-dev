(ns aicn.activity-logs
  (:require
   [java-time.api :as time]
   [clojure.string :as str]))

;; Store last 1000 activity logs in memory
(defonce activity-logs (atom []))
(def max-logs 1000)

(defn add-activity-log!
  "Add an activity log entry and maintain max size"
  [{:keys [type user-email user-name user-id message details]}]
  (let [log-entry {:id (str (java.util.UUID/randomUUID))
                   :timestamp (time/instant)
                   :type type
                   :user-email user-email
                   :user-name user-name
                   :user-id user-id
                   :message message
                   :details details}]
    (swap! activity-logs
           (fn [logs]
             (let [new-logs (conj logs log-entry)]
               (if (> (count new-logs) max-logs)
                 (vec (drop (- (count new-logs) max-logs) new-logs))
                 new-logs))))
    log-entry))

(defn get-activity-logs
  "Get activity logs with optional filtering"
  ([]
   (reverse @activity-logs))
  ([{:keys [limit type user-email from to]}]
   (let [logs @activity-logs
         filtered-logs (cond->> logs
                         type (filter #(= (:type %) type))
                         user-email (filter #(= (:user-email %) user-email))
                         from (filter #(time/after? (time/instant (:timestamp %))
                                                    (time/instant from)))
                         to (filter #(time/before? (time/instant (:timestamp %))
                                                   (time/instant to))))]
     (take (or limit 100) (reverse filtered-logs)))))

(defn clear-logs!
  "Clear all activity logs"
  []
  (reset! activity-logs []))

(defn get-stats
  "Get statistics about activity logs"
  []
  (let [logs @activity-logs
        now (time/instant)
        last-24h (time/minus now (time/hours 24))
        last-7d (time/minus now (time/days 7))
        last-30d (time/minus now (time/days 30))]
    {:total (count logs)
     :last-24h (count (filter #(time/after? (time/instant (:timestamp %)) last-24h) logs))
     :last-7d (count (filter #(time/after? (time/instant (:timestamp %)) last-7d) logs))
     :last-30d (count (filter #(time/after? (time/instant (:timestamp %)) last-30d) logs))
     :by-type (frequencies (map :type logs))
     :unique-users (count (distinct (map :user-email logs)))}))