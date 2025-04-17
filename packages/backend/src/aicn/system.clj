(ns aicn.system
  (:require [integrant.core :as ig]
            [aero.core :as aero]
            [aicn.db]
            [clojure.java.io :as io]
            [aicn.server]
            [aicn.adapters.airtable]
            [integrant.repl.state])
  (:gen-class))

(defmethod aero.core/reader 'ig/ref
  [{:keys [profile] :as opts} tag value]
  (integrant.core/ref value))

;; Gardez une référence au système actuel
(defn get-system []
  integrant.repl.state/system)

(defn get-config
  [profile]
  (aero/read-config
   (io/resource (if (= profile :local)
                  "config.local.edn"
                  "config.edn"))
   {:profile profile}))

(defn -main [& args]
  (let [config-file (if (System/getenv "DB_HOST")
                     ;; Si DB_HOST est défini, utiliser la config de production
                     (get-config :prod)
                     ;; Sinon, utiliser la config locale
                     (get-config :local))]
    (println "Starting system with config profile:" (if (System/getenv "DB_HOST") :prod :local))
    (ig/init config-file)))

(comment
  (get-system))
