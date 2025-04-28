(ns aicn.logger
  (:require [taoensso.telemere :as t]
            [integrant.core :as ig]))

;; Configuration du logger
(defmethod ig/init-key :logger/telemere [_ config]
  (t/set-min-level! (or (:min-level config) :info))
  config)

(defn info
  "Log an info message"
  [& args]
  (t/log! :info args))

(defn warn
  "Log a warning message"
  [& args]
  (t/log! :warn args))

(defn error
  "Log an error message"
  [& args]
  (t/log! :error args))

(defn debug
  "Log a debug message"
  [& args]
  (t/log! :debug args))

;; La fonction log peut être utilisée comme point d'entrée pour maintenir la compatibilité avec le code existant
(defn log
  "Log a message with the specified level (defaults to :info)"
  ([message]
   (log :info message))
  ([level message]
   (t/log! level message)))
