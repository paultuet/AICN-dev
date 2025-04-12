(ns aicn.schema
  (:require [malli.core :as m]
            [malli.registry :as mr]
            [malli.transform :as mt]
            [malli.experimental.time :as met]
            [malli.experimental.time.transform :as mett]
            [malli.error :as me]
            [camel-snake-kebab.core :as csk]
            [camel-snake-kebab.extras :as cske]))

(def registry (mr/composite-registry
               (m/default-schemas)
               (met/schemas)))

(malli.registry/set-default-registry!
 registry)

(def time-transformer
  (mt/transformer
   mett/time-transformer
   mt/json-transformer))

(defn -string->int [x]
  (try
    (Integer/parseInt x)
    (catch Exception e
      x)))

(defn -string->double [x]
  (try
    (Double/parseDouble x)
    (catch Exception e
      x)))

(defn -string->boolean [x]
  (if (string? x)
    (case x
      ("1" "true")  true
      ("0" "false")  false
      x)
    x))

(defn -maybe-nil-string->string [x]
  (case x
    (" - " "-" "" "?") nil
    x))

(def uuid-transformer
  (mt/transformer
   {:name :uuid-transformer
    :encoders {:uuid (fn [x]
                       (cond
                         (uuid? x) x
                         (string? x) (try
                                       (java.util.UUID/fromString x)
                                       (catch Exception _
                                         x))))}
    :decoders {:uuid (fn [x]
                       (cond
                         (uuid? x) x
                         (string? x) (try
                                       (java.util.UUID/fromString x)
                                       (catch Exception _
                                         x))))}}))

(defn transform-keys-recursive [m direction]
  (if (map? m)
    (let [transform-fn (case direction
                         :decode csk/->kebab-case-keyword
                         :encode csk/->snake_case_keyword)]
      (cske/transform-keys transform-fn
                           (into {} (map (fn [[k v]]
                                           [k (transform-keys-recursive v direction)])
                                         m))))
    m))

(def recursive-api-transformer
  (mt/transformer
   {:name :recursive-key-transformer
    :decoders {:map (fn [x] (transform-keys-recursive x :decode))}
    :encoders {:map (fn [x] (transform-keys-recursive x :encode))}}))

(def response-transformer
  (mt/transformer
   mett/time-transformer
   mt/json-transformer))

(def api-transformer
  (mt/key-transformer
    ;; Entrées: snake_case ou camelCase → kebab-case pour votre code Clojure
   {:decode csk/->kebab-case-keyword
    ;; Sorties: kebab-case → snake_case pour l'API (ou camelCase si vous préférez)
    :encode csk/->snake_case_keyword}))

(def custom-transformer
  (mt/transformer
   mt/default-value-transformer
   api-transformer
   mett/time-transformer
   mt/string-transformer))
   

(defn decode [schema data]
  (m/decode schema data {:registry registry} custom-transformer))

(defn encode [schema data]
  (m/encode schema data {:registry registry} custom-transformer))

(defn validate [schema data]
  (m/validate schema data {:registry registry}))

(defn explain [schema data]
  (m/explain schema data {:registry registry}))

(defn explain-humanize [schema data]
  (-> (explain schema data)
      me/humanize))

(defn coerce [schema data]
  (m/coerce schema data custom-transformer))

