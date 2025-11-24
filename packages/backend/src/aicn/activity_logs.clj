(ns aicn.activity-logs
  (:require
   [next.jdbc :as jdbc]
   [next.jdbc.result-set :as rs]
   [clojure.string :as str]))

(defn add-activity-log!
  "Add an activity log entry to the database"
  [datasource {:keys [type user-email user-name user-id message details]}]
  (jdbc/execute-one! datasource
                     ["INSERT INTO activity_logs (type, user_email, user_name, user_id, message, details)
                       VALUES (?::text, ?::text, ?::text, ?::text, ?::text, ?::jsonb)
                       RETURNING *"
                      (name type)
                      user-email
                      user-name
                      user-id
                      message
                      details]
                     {:builder-fn rs/as-unqualified-maps}))

(defn- build-where-clause
  "Build WHERE clause and params from filters"
  [{:keys [type user-email from to]}]
  (let [conditions []
        params []
        [conditions params] (if type
                              [(conj conditions "type = ?::text")
                               (conj params (if (keyword? type) (name type) type))]
                              [conditions params])
        [conditions params] (if user-email
                              [(conj conditions "user_email = ?::text")
                               (conj params user-email)]
                              [conditions params])
        [conditions params] (if from
                              [(conj conditions "timestamp >= ?::timestamptz")
                               (conj params from)]
                              [conditions params])
        [conditions params] (if to
                              [(conj conditions "timestamp <= ?::timestamptz")
                               (conj params to)]
                              [conditions params])
        where-clause (if (seq conditions)
                       (str " WHERE " (str/join " AND " conditions))
                       "")]
    [where-clause params]))

(defn count-activity-logs
  "Count activity logs with optional filtering"
  ([datasource]
   (count-activity-logs datasource {}))
  ([datasource filters]
   (let [[where-clause params] (build-where-clause filters)
         query (str "SELECT COUNT(*) as total FROM activity_logs" where-clause)]
     (:total (jdbc/execute-one! datasource
                                (into [query] params)
                                {:builder-fn rs/as-unqualified-maps})))))

(defn get-activity-logs
  "Get activity logs with optional filtering and pagination"
  ([datasource]
   (get-activity-logs datasource {}))
  ([datasource {:keys [limit offset] :as filters}]
   (let [[where-clause params] (build-where-clause filters)
         limit-val (or limit 100)
         offset-val (or offset 0)
         query (str "SELECT * FROM activity_logs" where-clause
                    " ORDER BY timestamp DESC LIMIT " limit-val
                    " OFFSET " offset-val)]
     (jdbc/execute! datasource
                    (into [query] params)
                    {:builder-fn rs/as-unqualified-maps}))))

(defn clear-logs!
  "Clear all activity logs (use with caution)"
  [datasource]
  (jdbc/execute! datasource ["DELETE FROM activity_logs"]))

(defn get-stats
  "Get statistics about activity logs"
  [datasource]
  (let [stats (jdbc/execute-one! datasource
                                 ["SELECT
                                     COUNT(*) as total,
                                     COUNT(*) FILTER (WHERE timestamp > NOW() - INTERVAL '24 hours') as last_24h,
                                     COUNT(*) FILTER (WHERE timestamp > NOW() - INTERVAL '7 days') as last_7d,
                                     COUNT(*) FILTER (WHERE timestamp > NOW() - INTERVAL '30 days') as last_30d,
                                     COUNT(DISTINCT user_email) as unique_users
                                   FROM activity_logs"]
                                 {:builder-fn rs/as-unqualified-maps})
        by-type (jdbc/execute! datasource
                               ["SELECT type, COUNT(*) as count FROM activity_logs GROUP BY type"]
                               {:builder-fn rs/as-unqualified-maps})]
    {:total (:total stats)
     :last-24h (:last_24h stats)
     :last-7d (:last_7d stats)
     :last-30d (:last_30d stats)
     :by-type (into {} (map (fn [row] [(keyword (:type row)) (:count row)]) by-type))
     :unique-users (:unique_users stats)}))
