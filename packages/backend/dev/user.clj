(ns user
  (:require [integrant.core :as ig]
            [integrant.repl :refer [clear go halt prep init reset reset-all]]
            [clojure.tools.namespace.repl :refer [set-refresh-dirs]]
            [aicn.system :as s]))

(set-refresh-dirs "src")

(def profile :local)

(integrant.repl/set-prep! #(ig/expand (s/get-config profile) (ig/deprofile [profile])))

(defn reload []
  (reset))

(comment
  (go)
  (reset)
  (halt))
