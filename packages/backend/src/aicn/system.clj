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
  (ig/init (get-config :dev)))

(comment
  (get-system))
