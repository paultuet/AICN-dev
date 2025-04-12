(ns aicn.db
  (:require [next.jdbc :as jdbc]
            [aicn.utils :as u]
            [integrant.core :as ig]
            [next.jdbc.prepare :as prepare]
            [next.jdbc.result-set :as rs]
            [next.jdbc.connection :as connection]
            [next.jdbc.sql :as sql]
            [aicn.schema :refer [encode decode]]
            [malli.core :as m]
            [aicn.model :as model]
            [malli.util :as mu])
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
(defn create-user [datasource {:keys [email password-hash name organization role access-rights]}]
  (->> (jdbc/execute-one! datasource
                     ["INSERT INTO users (email, password_hash, name, organization, role, access_rights) 
      VALUES (?::text, ?::text, ?::text, ?::text, ?::text, ?::jsonb) 
      RETURNING *"
                      email password-hash name organization role access-rights]
                     {:builder-fn rs/as-unqualified-maps})
       (decode model/User)))

(defn get-user-by-email [datasource email]
  (->> (jdbc/execute-one! datasource
                          ["SELECT * FROM users WHERE email = ?::text" email]
                          {:builder-fn rs/as-unqualified-maps})
       (decode model/User)))

(defn get-user-by-id [datasource id]
  (->> (jdbc/execute-one! datasource
                          ["SELECT * FROM users WHERE id = ?::uuid" id]
                          {:builder-fn rs/as-unqualified-maps})
       (decode model/User)))

(defn update-user [datasource {:keys [id name organization role access-rights]}]
  (->> (jdbc/execute-one! datasource
                          ["UPDATE users SET 
                            name = COALESCE(?::text, name),
                            organization = COALESCE(?::text, organization),
                            role = COALESCE(?::text, role),
                            access_rights = COALESCE(?::jsonb, access_rights),
                            updated_at = NOW()
                            WHERE id = ?::uuid
                            RETURNING *"
                           name organization role access-rights id]
                          {:builder-fn rs/as-unqualified-maps})
       (decode model/User)))

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
                 ;; SSL pour Supabase
                 (.addDataSourceProperty "sslmode" (:sslmode db-spec))
                 ;; Paramètres de connexion supplémentaires
                 (.setAutoCommit true)
                 (.setConnectionTestQuery "SELECT 1"))]
    (HikariDataSource. config)))

(defmethod ig/init-key :db/pg [_ {:keys [jdbc init]}]
  (let [ds (create-datasource jdbc)]
    {:ds ds}))

(defmethod ig/resolve-key :db/pg [_ {:keys [ds]}]
  ds)

(defmethod ig/halt-key! :db/pg [_ {:keys [ds]}]
  (println "Shutting down database connection pool...")
  (.close ds))

(comment
  (def s (aicn.system/get-system))
  (def ds (get-in s [:db/pg :ds]))
  (get-all-users ds))
