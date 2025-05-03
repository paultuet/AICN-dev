(ns aicn.migrations
  (:require [ragtime.jdbc :as jdbc]
            [ragtime.repl :as repl]
            [integrant.core :as ig]
            [clojure.java.io :as io]
            [next.jdbc :as next-jdbc]
            [hikari-cp.core :as hk]
            [aicn.logger :as log]))

(defn run-migrations [config]
  (log/info "Running database migrations...")
  (repl/migrate config)
  (log/info "Migrations completed successfully"))

(defn rollback-migration [config]
  (log/info "Rolling back last migration...")
  (repl/rollback config)
  (log/info "Rollback completed"))

(defn rollback-all [config]
  (log/info "Rolling back all migrations...")
  (let [ragtime-config config
        migration-count (count (:migrations config))]
    (repl/rollback ragtime-config migration-count))
  (log/info "Rollback completed"))

(defn create-migration [config name]
  (log/info (str "Creating new migration: " name))
  (let [migrations-dir (-> config :migrations first :path io/file .getParent)
        timestamp (System/currentTimeMillis)
        filename (format "%03d-%s" (inc (count (:migrations config))) name)
        up-file (io/file migrations-dir (str filename ".up.sql"))
        down-file (io/file migrations-dir (str filename ".down.sql"))]

    (io/make-parents up-file)
    (spit up-file "-- Migration Up SQL Here\n")
    (spit down-file "-- Migration Down SQL Here\n")

    (log/info (str "Created migration files: "
                   (.getName up-file) " and "
                   (.getName down-file))))
  (log/info "Migration files created"))

(defmethod ig/init-key :migrations/runner [_ {:keys [db-spec migrations-dir migrations-table]}]
  (let [config {:datastore (jdbc/sql-database db-spec {:migrations-table migrations-table})
                :migrations (jdbc/load-resources migrations-dir)}]
    (run-migrations config)
    config))

(comment
  (def s (aicn.system/get-system))
  (def config (:migrations/runner s))

  (repl/migrate config)
  (repl/rollback config))


