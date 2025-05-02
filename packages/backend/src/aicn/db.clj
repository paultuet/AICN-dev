(ns aicn.db
  (:require [next.jdbc :as jdbc]
            [aicn.utils :as u]
            [integrant.core :as ig]
            [next.jdbc.prepare :as prepare]
            [next.jdbc.result-set :as rs]
            [next.jdbc.connection :as connection]
            [next.jdbc.sql :as sql]
            [aicn.schema :refer [encode decode]]
            [hikari-cp.core :as hk]
            [malli.core :as m]
            [aicn.model :as model]
            [malli.util :as mu]
            [next.jdbc.date-time]
            [aicn.logger :as log])
  (:import (org.postgresql.util PGobject)
           (com.zaxxer.hikari HikariDataSource HikariConfig)
           (java.sql PreparedStatement)
           (java.util UUID)))

(defn generate-uuid []
  (UUID/randomUUID))

(defn str->uuid [s]
  (UUID/fromString s))

(defn- ->connection [pool]
  (jdbc/get-connection pool))

(defn- ->pgobject
  "Transforms Clojure data to a PGobject that contains the data as
  JSON. PGObject type defaults to `jsonb` but can be changed via
  metadata key `:pgtype`"
  [x]
  (let [pgtype (or (:pgtype (meta x)) "jsonb")]
    (doto (PGobject.)
      (.setType pgtype)
      (.setValue (u/to-json x)))))

(defn- <-pgobject
  "Transform PGobject containing `json` or `jsonb` value to Clojure data."
  [^PGobject v]
  (let [type  (.getType v)
        value (.getValue v)]
    (if (#{"jsonb" "json"} type)
      (some-> value u/from-json (with-meta {:pgtype type}))
      value)))

(extend-protocol prepare/SettableParameter
  clojure.lang.IPersistentMap
  (set-parameter [m ^PreparedStatement s i]
    (.setObject s i (->pgobject m)))

  clojure.lang.IPersistentVector
  (set-parameter [v ^PreparedStatement s i]
    (.setObject s i (->pgobject v))))

(extend-protocol rs/ReadableColumn
  org.postgresql.util.PGobject
  (read-column-by-label [^org.postgresql.util.PGobject v _]
    (<-pgobject v))
  (read-column-by-index [^org.postgresql.util.PGobject v _2 _3]
    (<-pgobject v)))

;; User functions
(defn create-user [datasource {:keys [email password-hash name organization role access-rights verification-token verification-token-expires-at]}]
  (->> (jdbc/execute-one! datasource
                          ["INSERT INTO users (
                       email, 
                       password_hash, 
                       name, 
                       organization, 
                       role, 
                       access_rights,
                       email_verified,
                       verification_token,
                       verification_token_expires_at
                     ) 
                      VALUES (
                        ?::text, 
                        ?::text, 
                        ?::text, 
                        ?::text, 
                        ?::text, 
                        ?::jsonb,
                        FALSE,
                        ?::uuid,
                        ?::timestamptz
                      ) 
                      RETURNING *"
                           email
                           password-hash
                           name
                           organization
                           role
                           access-rights
                           verification-token
                           verification-token-expires-at]
                          {:builder-fn rs/as-unqualified-maps})
       (decode model/User)))

(defn get-user-by-email [datasource email]
  (->> (jdbc/execute-one! datasource
                          ["SELECT * FROM users WHERE email = ?::text" email]
                          {:builder-fn rs/as-unqualified-maps})
       (decode model/User)))

(defn get-user-by-verification-token [datasource token]
  (->> (jdbc/execute-one! datasource
                          ["SELECT * FROM users WHERE verification_token = ?::uuid" token]
                          {:builder-fn rs/as-unqualified-maps})
       (decode model/User)))

(defn get-user-by-id [datasource id]
  (->> (jdbc/execute-one! datasource
                          ["SELECT * FROM users WHERE id = ?::uuid" id]
                          {:builder-fn rs/as-unqualified-maps})
       (decode model/User)))

(defn update-user [datasource {:keys [id name organization role access-rights email-verified verification-token verification-token-expires-at]}]
  (let [log-ds (jdbc/with-logging datasource (fn [sym sql-params]
                                               (prn sym sql-params)))

        res (jdbc/execute-one! log-ds
                               ["UPDATE users SET 
                            name = COALESCE(?::text, name),
                            organization = COALESCE(?::text, organization),
                            role = COALESCE(?::text, role),
                            access_rights = COALESCE(?::jsonb, access_rights),
                            email_verified = COALESCE(?::boolean, email_verified),
                            verification_token = ?::uuid,
                            verification_token_expires_at = ?::timestamptz,
                            updated_at = NOW()
                            WHERE id = ?::uuid
                            RETURNING *"
                                name organization role access-rights email-verified verification-token verification-token-expires-at id]
                               {:builder-fn rs/as-unqualified-maps})]
    (println res)
    (decode model/User res)))

(defn update-user-password [datasource {:keys [id password-hash]}]
  (->> (jdbc/execute-one! datasource
                          ["UPDATE users SET 
                            password_hash = ?::text,
                            updated_at = NOW()
                            WHERE id = ?::uuid
                            RETURNING *"
                           password-hash id]
                          {:builder-fn rs/as-unqualified-maps})
       (decode model/User)))

(defn get-all-users [datasource]
  (->> (jdbc/execute! datasource
                      ["SELECT * FROM users ORDER BY created_at DESC"]
                      {:builder-fn rs/as-unqualified-maps})
       (decode [:vector model/User])))

;; Conversation functions
(defn create-conversation [datasource {:keys [table-id item-id]}]
  (->> (jdbc/execute-one! datasource
                          ["INSERT INTO conversations (table_id, item_id, status) 
                            VALUES (?::uuid, ?::text, 'OPEN') 
                            RETURNING *"
                           table-id item-id]
                          {:builder-fn rs/as-unqualified-maps})
       (decode model/Conversation)))

(defn get-conversation [datasource id]
  (->> (jdbc/execute-one! datasource
                          ["SELECT * FROM conversations WHERE id = ?::uuid" id]
                          {:builder-fn rs/as-unqualified-maps})
       (decode model/Conversation)))

(defn get-conversation-by-table-and-item [datasource table-id item-id]
  (->> (jdbc/execute-one! datasource
                          ["SELECT * FROM conversations 
                            WHERE table_id = ?::uuid AND item_id = ?::text"
                           table-id item-id]
                          {:builder-fn rs/as-unqualified-maps})
       (decode model/Conversation)))

(defn get-conversations-by-table [datasource table-id]
  (->> (jdbc/execute! datasource
                      ["SELECT c.*, 
                        (SELECT COUNT(*) FROM messages WHERE conversation_id = c.id) as message_count
                        FROM conversations c
                        WHERE c.table_id = ?::uuid 
                        ORDER BY c.updated_at DESC"
                       table-id]
                      {:builder-fn rs/as-unqualified-maps})
       (decode [:vector (mu/assoc model/Conversation :message-count :int)])))

(defn get-all-conversations [datasource]
  (->> (jdbc/execute! datasource
                      ["SELECT c.*, 
                        t.name as table_name,
                        (SELECT COUNT(*) FROM messages WHERE conversation_id = c.id) as message_count
                        FROM conversations c
                        JOIN tables t ON c.table_id = t.id
                        ORDER BY c.updated_at DESC"]
                      {:builder-fn rs/as-unqualified-maps})
       (decode [:vector (-> model/Conversation
                            (mu/assoc :table-name :string)
                            (mu/assoc :message-count :int))])))

(defn update-conversation-status [datasource {:keys [id status]}]
  (let [now (java.time.Instant/now)
        closed-at (when (= status "CLOSED") now)
        archived-at (when (= status "ARCHIVED") now)]
    (->> (jdbc/execute-one! datasource
                            ["UPDATE conversations SET 
                              status = ?::text,
                              closed_at = CASE WHEN ?::text = 'CLOSED' THEN NOW() ELSE closed_at END,
                              archived_at = CASE WHEN ?::text = 'ARCHIVED' THEN NOW() ELSE archived_at END,
                              updated_at = NOW()
                              WHERE id = ?::uuid
                              RETURNING *"
                             status status status id]
                            {:builder-fn rs/as-unqualified-maps})
         (decode model/Conversation))))

;; Message functions
(defn create-message [datasource {:keys [conversation-id user-id content]}]
  (->> (jdbc/execute-one! datasource
                          ["WITH msg AS (
                            INSERT INTO messages (conversation_id, user_id, content) 
                            VALUES (?::uuid, ?::uuid, ?::text) 
                            RETURNING *
                          )
                          UPDATE conversations
                          SET updated_at = NOW()
                          WHERE id = ?::uuid;
                          SELECT * FROM msg"
                           conversation-id user-id content conversation-id]
                          {:builder-fn rs/as-unqualified-maps})
       (decode model/Message)))

(defn get-messages-by-conversation [datasource conversation-id]
  (->> (jdbc/execute! datasource
                      ["SELECT m.*, u.name as user_name 
                        FROM messages m
                        JOIN users u ON m.user_id = u.id
                        WHERE m.conversation_id = ?::uuid 
                        ORDER BY m.created_at"
                       conversation-id]
                      {:builder-fn rs/as-unqualified-maps})
       (decode [:vector (mu/assoc model/Message :user-name :string)])))

;; Feature Flag functions
(defn get-all-feature-flags [datasource]
  (->> (jdbc/execute! datasource
                     ["SELECT * FROM feature_flags ORDER BY name ASC"]
                     {:builder-fn rs/as-unqualified-maps})
       (decode [:vector model/FeatureFlag])))

(defn create-datasource [db-spec]
  (let [config (doto (HikariConfig.)
                 (.setJdbcUrl (str "jdbc:postgresql://" (:host db-spec) ":" (:port db-spec) "/" (:dbname db-spec)))
                 (.setUsername (:user db-spec))
                 (.setPassword (:password db-spec))
                 ;; Paramètres cruciaux pour limiter les connexions
                 (.setMaximumPoolSize 10)  ;; Un peu en dessous du max de 15
                 (.setMinimumIdle 1)
                 (.setIdleTimeout 300000)  ;; 5 minutes
                 (.setMaxLifetime 1800000) ;; 30 minutes
                 (.setConnectionTimeout 30000)
                 (.setLeakDetectionThreshold 60000) ;; Détecte les fuites après 60s
                 (.setPoolName "supabase-pool")
                 ; (.setSchema (:current-schema db-spec))
                 ;; SSL pour Supabase
                 (.addDataSourceProperty "sslmode" (:sslmode db-spec))
                 ;; Paramètres de connexion supplémentaires
                 (.setAutoCommit true)
                 (.setConnectionTestQuery "SELECT 1")
                 ;; Réduire la verbosité des logs
                 (.setRegisterMbeans false))]
    (HikariDataSource. config)))

(defn jdbc->hk-config [jdbc]
  {:auto-commit        true
   :read-only          false
   :connection-timeout 30000
   :validation-timeout 5000
   :idle-timeout       600000
   :max-lifetime       1800000
   :minimum-idle       10
   :maximum-pool-size  10
   :pool-name          "supabase-pool"
   :adapter            "postgresql"
   :username           (:user jdbc)
   :password           (:password jdbc)
   :database-name      (:dbname jdbc)
   :server-name        (:host jdbc)
   :port-number        (:port jdbc)
   :register-mbeans    false
   :sslmode (:sslmode jdbc)})

(defmethod ig/init-key :db/jdbc [_ jdbc]
  jdbc)

(defmethod ig/init-key :db/pg [_ {:keys [jdbc init]}]
  (let [ds (create-datasource jdbc) #_(hk/make-datasource (jdbc->hk-config jdbc))]
    {:ds ds}))

(defmethod ig/resolve-key :db/pg [_ {:keys [ds]}]
  ds)

(defmethod ig/halt-key! :db/pg [_ {:keys [ds]}]
  (println "Shutting down database connection pool...")
  (.close ds))

(comment
  (def conf (aicn.system/get-config :local))
  (jdbc->hk-config (get-in conf [:db/pg :jdbc]))
  (def s (aicn.system/get-system))
  (def ds (get-in s [:db/pg :ds]))
  (get-all-users ds))
