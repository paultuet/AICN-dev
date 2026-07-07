(ns aicn.adapters.adoption
  "Live Airtable proxy for the two adoption dashboards.
   Unlike aicn.adapters.airtable (which caches whole tables to JSON on /sync),
   this fetches on demand: logo attachment URLs are short-lived (Airtable expires
   them after a few hours), so caching them would break the logo tiles.

   Reuses the transport (auth + pagination) from aicn.adapters.airtable and only
   adds the adoption-specific field mapping."
  (:require
   [aicn.adapters.airtable :as airtable]
   [clojure.string :as str]
   [integrant.core :as ig])
  (:import [java.text Normalizer Normalizer$Form]))

;; ---------------------------------------------------------------------------
;; Table ids (stable across table/field renames)
;; ---------------------------------------------------------------------------

(def ^:const table-dash-adopt "tblI5jo1D4Nw6WCHs") ; dash_adopt  — suivi par statut
(def ^:const table-pgm-adopt  "tblqTOtjFebcdC6E0") ; pgm_adopt   — programmes (référentiel)
(def ^:const table-agenda     "tblwWw09d9AhtiE0q") ; agenda      — événements

;; ---------------------------------------------------------------------------
;; Case- and accent-insensitive field lookup (spec §4.1)
;; The jsonista mapper (aicn.utils) keywordizes field names replacing spaces with
;; dashes; case/accents/parentheses are preserved. We normalize both the record
;; keys and the logical label the same way, so lookups tolerate case/accent drift
;; in the Airtable field labels.
;; ---------------------------------------------------------------------------

(defn- norm-field
  "Normalize a field label for lookup: lowercase, strip accents, collapse
   spaces/dashes. 'Type de métier (from Company)' and the from-json key
   ':Type-de-métier-(from-Company)' both normalize to the same string."
  [s]
  (-> (str s)
      str/lower-case
      (Normalizer/normalize Normalizer$Form/NFD)
      (str/replace #"\p{M}+" "")      ; drop combining accent marks
      (str/replace #"[\s-]+" "-")))

(defn- field-index
  "Build a {normalized-name -> value} map from a record's :fields."
  [fields]
  (into {} (map (fn [[k v]] [(norm-field (name k)) v]) fields)))

(defn- fget
  "Look up a field by human label against a normalized field index."
  [idx label]
  (get idx (norm-field label)))

;; ---------------------------------------------------------------------------
;; Integrant — value component holding {:token :app-id}.
;; config.edn defaults these to the main AIRTABLE_* creds, overridable via
;; ADOPTION_AIRTABLE_* if the adoption tables live in a different base.
;; ---------------------------------------------------------------------------

(defmethod ig/init-key :adapter/adoption-airtable [_ props] props)

(defn- assert-configured! [{:keys [token app-id]}]
  (when (or (str/blank? (str token)) (str/blank? (str app-id)))
    (throw (ex-info "Adoption Airtable not configured (token/app-id missing)"
                    {:type :adoption/not-configured}))))

(defn- fetch-table [auth table-id]
  (assert-configured! auth)
  (airtable/fetch-all auth table-id))

;; ---------------------------------------------------------------------------
;; Pure helpers
;; ---------------------------------------------------------------------------

(defn- unwrap
  "Airtable link/lookup fields are arrays even for single values."
  [v]
  (if (sequential? v) (first v) v))

(defn- clean-filename
  "Best-effort human label from a logo filename: drop extension, collapse
   separators. 'Vinci Failcities.png' -> 'Vinci Failcities'."
  [filename]
  (when (string? filename)
    (let [s (-> filename
                (str/replace #"\.[A-Za-z0-9]+$" "")
                (str/replace #"[_-]+" " ")
                str/trim)]
      (when (seq s) s))))

(defn- logo-info
  "Extract {:url :filename} from the first attachment of a Logo lookup field.
   Prefers the large then small thumbnail, falling back to the full url."
  [attachments]
  (when-let [a (first (if (sequential? attachments) attachments [attachments]))]
    (when (map? a)
      {:url      (or (get-in a [:thumbnails :large :url])
                     (get-in a [:thumbnails :small :url])
                     (:url a))
       :filename (:filename a)})))

;; ---------------------------------------------------------------------------
;; Dashboard 1 — adoption status matrix
;; ---------------------------------------------------------------------------

(defn- program-name [record]
  (fget (field-index (:fields record)) "Name"))

(defn- program-rank
  "Presentation order from the pgm_adopt RANK column (client-maintained)."
  [record]
  (fget (field-index (:fields record)) "RANK"))

(defn- by-rank
  "Sort programme records by RANK ascending; records without a rank go last."
  [records]
  (sort-by #(let [r (program-rank %)] (if (number? r) r Long/MAX_VALUE)) records))

(defn- program-index
  "record-id -> program name, from the pgm_adopt referential (fallback resolver)."
  [pgm-records]
  (into {} (map (fn [r] [(:id r) (program-name r)]) pgm-records)))

(defn- ->matrix-row [pgm-idx record]
  (let [f       (field-index (:fields record))
        pgm-id  (unwrap (fget f "pgm_adopt"))
        logo    (logo-info (fget f "Logo (from Company)"))
        company (or (unwrap (fget f "Name (from Company)"))     ; explicit name lookup if present
                    (clean-filename (:filename logo))
                    (unwrap (fget f "Métier (from Company)")))]
    {:id          (:id record)
     :programId   pgm-id
     :programName (or (unwrap (fget f "Name (from pgm_adopt)")) (get pgm-idx pgm-id))
     :statut      (fget f "statut")
     :typeMetier  (unwrap (fget f "Type de métier (from Company)"))
     :companyName company
     :logoUrl     (:url logo)}))

(defn get-adoption-status-matrix
  "Return {:programs [{:id :name}] :rows [...]} for the status matrix.
   :rows are normalized adoption entries; :programs is the full referential so the
   frontend can lay out all rows (even empty ones) in a stable order."
  [auth]
  (let [pgm  (fetch-table auth table-pgm-adopt)
        idx  (program-index pgm)
        rows (fetch-table auth table-dash-adopt)]
    {:programs (mapv (fn [p] {:id (:id p) :name (program-name p) :rank (program-rank p)})
                     (by-rank pgm))
     :rows     (mapv #(->matrix-row idx %) rows)}))

;; ---------------------------------------------------------------------------
;; Dashboard 2 — programmes + agenda
;; ---------------------------------------------------------------------------

(defn- event-program-id [e]
  (unwrap (fget (field-index (:fields e)) "pgm_adopt")))

(defn- ->event [e]
  (let [f (field-index (:fields e))]
    {:id        (:id e)
     :programId (unwrap (fget f "pgm_adopt"))
     :numEvent  (fget f "num_event")
     :titre     (fget f "titre_event")
     :date      (fget f "Date")}))

(defn- ->program-card [p events-by-pgm]
  (let [f (field-index (:fields p))]
    {:id            (:id p)
     :name          (fget f "Name")
     :rank          (fget f "RANK")
     :description   (fget f "Description du programme")
     :cible         (fget f "Cible")
     :livrables     (fget f "Livrables")
     :communication (fget f "Communication")
     :events        (->> (get events-by-pgm (:id p) [])
                         (mapv ->event)
                         (sort-by (fn [e] [(or (:numEvent e) 0) (str (:date e))]))
                         vec)}))

(defn get-adoption-programmes
  "Return {:programmes [{:id :name :description :cible :livrables :communication
   :events [...]}]}. Each event is attached to its program via the pgm_adopt link."
  [auth]
  (let [pgm    (by-rank (fetch-table auth table-pgm-adopt))
        events (fetch-table auth table-agenda)
        by-pgm (group-by event-program-id events)]
    {:programmes (mapv #(->program-card % by-pgm) pgm)}))

(comment
  (def s (aicn.system/get-system))
  (def auth (:adapter/adoption-airtable s))
  (clojure.pprint/pprint (take 2 (:rows (get-adoption-status-matrix auth))))
  (clojure.pprint/pprint (first (:programmes (get-adoption-programmes auth)))))
