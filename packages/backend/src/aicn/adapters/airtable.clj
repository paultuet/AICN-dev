(ns aicn.adapters.airtable
  (:require
   [aicn.utils :as u]
   [clojure.java.io :as io]
   [clojure.pprint :as pprint]
   [clojure.string :as str]
   [hato.client :as hc]
   [integrant.core :as ig]))

;; ---------------------------------------------------------------------------
;; Constants
;; ---------------------------------------------------------------------------

(def ^:private table-names
  {:tables-sources "Tables Sources"
   :lov-new "lov_new"})

(def ^:private niv1-rank-config
  "Ordering for Niveau 1 categories (from Classement NIVEAU 1 spec sheet)"
  {"Inventaire d'équipements"                              1
   "Inventaires d'équipements"                             1
   "Inventaire d'espaces"                                  2
   "Inventaires d'espaces"                                 2
   "Inventaire de contrats"                                3
   "Inventaires de contrats"                               3
   "Inventaire de tiers"                                   4
   "Inventaires de tiers"                                  4
   "Inventaire de systèmes"                                5
   "Inventaires de systèmes"                               5
   "Plans de comptage électriques"                         6
   "PPAT"                                                  7
   "Rapports d'observations de contrôle périodique"        8
   "Rapports d'observation de bureaux de contrôle"         8
   "Historique consommation énergétique"                   9
   "Historique de consommation énergétique"                9})

;; ---------------------------------------------------------------------------
;; Generic helpers (kept from previous version)
;; ---------------------------------------------------------------------------

(defn- ->url [{:keys [app-id]} table-name]
  (str "https://api.airtable.com/v0/" app-id "/" table-name))

(defn- request [{:keys [token] :as auth} {:keys [method table-name offset]}]
  (try
    (let [response (hc/request (cond-> {:url (->url auth table-name)
                                        :method method
                                        :headers {"Authorization" (str "Bearer " token)}
                                        :throw-exceptions false}
                                 offset (assoc-in [:query-params :offset] offset)))]
      (when (>= (:status response) 400)
        (throw (ex-info "Airtable API request failed"
                        {:type :airtable/api-error
                         :status (:status response)
                         :table table-name
                         :body (:body response)})))
      (-> response :body u/from-json))
    (catch Exception e
      (if (= :airtable/api-error (-> e ex-data :type))
        (throw e)
        (throw (ex-info "Failed to communicate with Airtable"
                        {:type :airtable/request-error
                         :table table-name
                         :message (.getMessage e)}
                        e))))))

(defn- spit-json
  "Write data as JSON to avoid EDN keyword issues with special characters in Airtable field names"
  [file-path data]
  (try
    (spit file-path (u/to-json data))
    (catch Exception e
      (throw (ex-info "Failed to write data to file"
                      {:type :file/write-error
                       :file-path file-path
                       :message (.getMessage e)}
                      e)))))

(defn- fetch-all [auth table-name]
  (loop [all-records []
         initial-offset nil]
    (let [{:keys [records offset]} (request auth {:method :get :table-name table-name :offset initial-offset})]
      (if offset
        (recur (concat all-records records)
               offset)
        (into [] (concat all-records records))))))

;; ---------------------------------------------------------------------------
;; Integrant
;; ---------------------------------------------------------------------------

(defmethod ig/init-key :adapter/airtable [_ {:keys [token app-id] :as props}]
  props)

;; ---------------------------------------------------------------------------
;; Sync
;; ---------------------------------------------------------------------------

(def tables [(:tables-sources table-names) (:lov-new table-names)])

(defn get-tables-names []
  tables)

(def ^:private data-dir
  "Writable directory for cached Airtable data. Configurable via DATA_DIR env var.
   Defaults to 'resources/data' for local dev. In production set to a path on a
   persistent volume (e.g., '/data/cache' on Fly.io) so syncs survive restarts."
  (or (System/getenv "DATA_DIR") "resources/data"))

(defn- write-data-file
  "Resolve and create the parent directory for a writable cache file."
  [filename]
  (let [f (io/file data-dir filename)]
    (io/make-parents f)
    f))

(defn sync-tables [auth tables]
  (doseq [table tables]
    (let [data (fetch-all auth table)
          filename (str (str/replace table #" " "-") ".json")]
      (spit-json (write-data-file filename) data))))

;; ---------------------------------------------------------------------------
;; File reading
;; ---------------------------------------------------------------------------

(defn- read-file-table
  "Read a cached table file. Prefers the writable data-dir (filled by /sync);
   falls back to the JAR-bundled seed when no sync has run yet."
  [table]
  (try
    (let [filename (str table ".json")
          cached   (io/file data-dir filename)
          source   (if (.exists cached)
                     cached
                     (or (io/resource (str "data/" filename))
                         (throw (ex-info "Table file not found"
                                         {:type :file/not-found
                                          :table table}))))]
      (u/from-json (slurp source)))
    (catch Exception e
      (throw (ex-info "Failed to read table file"
                      {:type :file/read-error
                       :table table
                       :message (.getMessage e)}
                      e)))))

;; ---------------------------------------------------------------------------
;; String normalization (for sorting & entity-id generation)
;; ---------------------------------------------------------------------------

(def ^:private accent-map
  "Map of accented characters to their non-accented equivalents"
  {"é" "e" "è" "e" "ê" "e" "ë" "e"
   "à" "a" "â" "a" "ä" "a"
   "î" "i" "ï" "i"
   "ô" "o" "ö" "o"
   "ù" "u" "û" "u" "ü" "u"
   "ç" "c"})

(defn- normalize-string
  "Normalize string by converting to lowercase and removing accents"
  [s]
  (when s
    (let [lowercased (str/lower-case s)]
      (reduce-kv
       (fn [result accented unaccented]
         (str/replace result accented unaccented))
       lowercased
       accent-map))))

(defn- name->entity-id
  "Generate a deterministic entity-id from a name string"
  [prefix name]
  (when name
    (-> (str prefix "-" (normalize-string name))
        (str/replace #"[^a-z0-9-]" "-")
        (str/replace #"-+" "-")
        (str/replace #"^-|-$" ""))))

;; ---------------------------------------------------------------------------
;; Tables Sources: record mapping
;; ---------------------------------------------------------------------------

(defn- unwrap-lookup
  "Airtable 'from' lookup fields return arrays even for single values. Unwrap safely."
  [v]
  (if (sequential? v) (first v) v))

;; Keyword constants for Airtable field names (after jsonista mapper transforms spaces to dashes)
(def ^:private k-code-champ          (keyword "Code-champ"))
(def ^:private k-nom-table           (keyword "Nom-de-la-table"))
(def ^:private k-nom-champ-code      (keyword "Nom-du-champ-codé"))
(def ^:private k-type-donnee         (keyword "Type-de-donnée"))
(def ^:private k-cle-primaire        (keyword "Clé-primaire-(PK)"))
(def ^:private k-cle-etrangere       (keyword "Clé-étrangère-(FK)"))
(def ^:private k-commentaire         (keyword "Commentaire"))
(def ^:private k-niveau-1            (keyword "Niveau-1-(from-Tables-REF)"))
(def ^:private k-niveau-2            (keyword "Niveau-2-(from-Tables-REF)"))
(def ^:private k-libelle             (keyword "Libellé-du-champ-(from-Tables-REF)"))
(def ^:private k-exemple             (keyword "Exemple-(from-Tables-REF)"))
(def ^:private k-rank                (keyword "rank-(from-Tables-REF)"))
(def ^:private k-rank-niv2           (keyword "rank_niv2-(from-Tables-REF)"))
(def ^:private k-champ-multivalue    (keyword "Champ-multivalué-(from-Tables-REF)"))

(defn- map-tables-sources-record
  "Map a raw Airtable record from 'Tables Sources' into internal representation."
  [record]
  (let [fields (:fields record)]
    {:id            (:id record)
     :code-champ    (get fields k-code-champ)
     :nom-table     (get fields k-nom-table)
     :nom-champ-code (get fields k-nom-champ-code)
     :type-donnee   (get fields k-type-donnee)
     :cle-primaire  (get fields k-cle-primaire)
     :cle-etrangere (get fields k-cle-etrangere)
     :commentaire   (get fields k-commentaire)
     :niveau-1      (unwrap-lookup (get fields k-niveau-1))
     :niveau-2      (unwrap-lookup (get fields k-niveau-2))
     :libelle       (unwrap-lookup (get fields k-libelle))
     :exemple       (unwrap-lookup (get fields k-exemple))
     :rank          (unwrap-lookup (get fields k-rank))
     :rank-niv2     (unwrap-lookup (get fields k-rank-niv2))
     :champ-multivalue (unwrap-lookup (get fields k-champ-multivalue))}))

;; ---------------------------------------------------------------------------
;; Tables Sources: hierarchy builder
;; ---------------------------------------------------------------------------

(defn- make-source-field
  "Build a leaf field entry from a mapped Tables Sources record"
  [record]
  {:id             (:id record)
   :entity-id      (:id record)
   :entity-name    (or (:libelle record) (:code-champ record))
   :code-champ     (:code-champ record)
   :libelle        (:libelle record)
   :commentaire    (:commentaire record)
   :nom-champ-code (:nom-champ-code record)
   :type-donnee    (:type-donnee record)
   :cle-primaire   (:cle-primaire record)
   :cle-etrangere  (:cle-etrangere record)
   :exemple        (:exemple record)
   :rank           (:rank record)
   :niveau         3
   :niveau-1       (:niveau-1 record)
   :niveau-2       (:niveau-2 record)
   :champ-multivalue (:champ-multivalue record)})

(defn- parse-rank
  "Parse a rank value to a number. Handles strings, numbers, and nil."
  [v]
  (cond
    (number? v) (double v)
    (string? v) (try (Double/parseDouble (str/replace v #"," "."))
                     (catch Exception _ Double/MAX_VALUE))
    :else Double/MAX_VALUE))

(defn- sort-fields
  "Sort fields by rank (numeric), falling back to alphabetical by libelle"
  [fields]
  (sort-by (fn [f]
             [(parse-rank (:rank f))
              (normalize-string (or (:libelle f) (:entity-name f) ""))])
           fields))

(defn- sort-niv2
  "Sort NIV2 entities by rank-niv2, falling back to alphabetical"
  [niv2-groups]
  (sort-by (fn [[niv2-name records]]
             (let [rank (some :rank-niv2 records)]
               [(parse-rank rank)
                (normalize-string (or niv2-name ""))]))
           niv2-groups))

(defn- build-tables-sources-hierarchy
  "Build the 2-level hierarchy from Tables Sources data.
   Returns a vector of Niveau 1 entities, each containing Niveau 2 entities,
   each containing leaf SourceField entries."
  []
  (let [raw-data     (read-file-table "Tables-Sources")
        all-records  (map map-tables-sources-record raw-data)
        ;; Filter out records without a Niveau 1
        valid-records (filter :niveau-1 all-records)
        ;; Group by Niveau 1
        by-niv1      (group-by :niveau-1 valid-records)]
    (->> by-niv1
         (map (fn [[niv1-name niv1-records]]
                (let [niv1-id   (name->entity-id "niv1" niv1-name)
                      by-niv2   (group-by :niveau-2 niv1-records)
                      niv2-entities
                      (->> (sort-niv2 by-niv2)
                           (map (fn [[niv2-name niv2-records]]
                                  (let [niv2-id (name->entity-id "niv2" (str niv1-name "--" niv2-name))]
                                    {:entity-id   niv2-id
                                     :entity-name (or niv2-name "Autres")
                                     :niveau      2
                                     :rank        (some :rank-niv2 niv2-records)
                                     :fields      (sort-fields (mapv make-source-field niv2-records))})))
                           (into []))]
                  {:entity-id   niv1-id
                   :entity-name niv1-name
                   :niveau      1
                   :rank        (get niv1-rank-config niv1-name Integer/MAX_VALUE)
                   :fields      niv2-entities})))
         (sort-by (fn [e]
                    [(or (:rank e) Integer/MAX_VALUE)
                     (normalize-string (or (:entity-name e) ""))]))
         (into []))))

;; ---------------------------------------------------------------------------
;; Public API
;; ---------------------------------------------------------------------------

(defn get-all-referentiels
  "Build the complete referential hierarchy.
   Returns a flat vector of Niveau 1 entities from Tables Sources."
  []
  (build-tables-sources-hierarchy))

(defn get-all-lov-new
  "Read all lov_new entries from the cached JSON file."
  []
  (try
    (->> (read-file-table "lov_new")
         (map :fields))
    (catch Exception _e [])))

(comment
  (def s (aicn.system/get-system))
  (def auth (get s :adapter/airtable))
  (sync-tables auth (get-tables-names))
  (get-all-referentiels))
