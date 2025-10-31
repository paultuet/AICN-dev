(ns aicn.adapters.airtable
  (:require
   [aicn.utils :as u]
   [clojure.java.io :as io]
   [clojure.pprint :as pprint]
   [clojure.string :as str]
   [hato.client :as hc]
   [integrant.core :as ig]
   [meander.epsilon :as m]
   [medley.core :as md]))

;; Constants
(def ^:private entity-types
  {:rio "RIO"
   :nmr "NMR"
   :lov "LoV"
   :unknown "UNKNOWN"})

(def ^:private table-names
  {:liens-niveaux "liens-niveaux"
   :ref-list "ref_list"
   :cat-ref "cat_ref"
   :lov "lov"})

(def ^:private niveau-keys
  {:niv1 :NIV1
   :niv2 :NIV2
   :niv3 :NIV3
   :niv4 :NIV4})

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

(defn- spit-pretty [file-path data]
  (try
    (with-open [w (io/writer file-path)]
      (binding [*out* w
                *print-length* nil
                *print-level* nil]
        (pprint/pprint data)))
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

(defmethod ig/init-key :adapter/airtable [_ {:keys [token app-id] :as props}]
  props)

(defn sync-tables [auth tables]
  (doseq [table tables]
    (let [data (fetch-all auth table)]
      (spit-pretty (io/resource (format "data/%s.edn" (str/replace table #" " "-"))) data))))

(def tables ["liens niveaux" (:lov table-names) (:cat-ref table-names) (:ref-list table-names)])

(defn get-tables-names []
  tables)

(defn- read-file-table [table]
  (try
    (let [file-path (format "data/%s.edn" table)
          resource (io/resource file-path)]
      (when-not resource
        (throw (ex-info "Table file not found"
                        {:type :file/not-found
                         :table table
                         :path file-path})))
      (read-string (slurp resource)))
    (catch Exception e
      (throw (ex-info "Failed to read table file"
                      {:type :file/read-error
                       :table table
                       :message (.getMessage e)}
                      e)))))

(defn- get-category [cat-ref-table category-id]
  (let [category-data (first (filter #(= (:id %) category-id) cat-ref-table))
        inv (get-in category-data [:fields :Inventaire-d'équipement])]
    (when category-data
      (cond-> {:id category-id
               :name (get-in category-data [:fields :Name])}
        #_#_:inv (assoc :inv inv)))))

(defn- get-entity [ref-list-map entity-id]
  (let [entity-data (get ref-list-map entity-id)]
    (when entity-data
      {:id entity-id
       :name (get-in entity-data [:fields :ref_name])})))

(defn get-all-fields []
  (let [ref-list-data (read-file-table "ref_list")
        cat-ref-map (md/index-by :id (read-file-table "cat_ref"))
        ref-list-map (md/index-by :id ref-list-data)
        liens-niveaux (read-file-table "liens-niveaux")
        lov-table (read-file-table "lov")]
    (->> ref-list-data
         (filter #(= "RIO" (get-in % [:fields :Type_record])))
         (map (fn [ref-item]
                (let [entity-id (:id ref-item)
                      record-name (get-in ref-item [:fields :record_name])
                      niveau (get-in ref-item [:fields :Niveau_record])
                      id-record (get-in ref-item [:fields :ID_record])
                      var-type (get-in ref-item [:fields :Var_type])
                      link-entity-id (when-let [links (get-in ref-item [:fields :link])]
                                       (first links))]
                  {:id-field id-record
                   :lib-fonc record-name
                   :var-type var-type
                   :niveau niveau
                   :entity-id entity-id
                   :entity {:id entity-id
                            :name record-name}
                   :link-entity-id link-entity-id})))
         (into []))))

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
  (let [lowercased (str/lower-case s)]
    (reduce-kv
     (fn [result accented unaccented]
       (str/replace result accented unaccented))
     lowercased
     accent-map)))

(defn get-lov-details [all-lov lov-name])

(defn- build-level-mapping
  "Build parent-child mapping for a specific level relationship"
  [liens-niveaux child-key parent-key]
  (reduce (fn [acc link]
            (let [child-ids (get-in link [:fields child-key])
                  parent-ids (get-in link [:fields parent-key])]
              (if (and child-ids parent-ids)
                (reduce (fn [a child-id]
                          (assoc a child-id (first parent-ids)))
                        acc
                        child-ids)
                acc)))
          {}
          liens-niveaux))

(defn- build-niv4-mapping
  "Build NIV4 to NIV3 mapping by matching record names.
   NIV4 is stored as a string name in liens-niveaux, not as an array of IDs like other levels."
  [liens-niveaux ref-list-map]
  (reduce (fn [acc link]
            (let [niv4-name (get-in link [:fields :NIV4])
                  niv3-ids (get-in link [:fields :NIV3])]
              (if (and niv4-name niv3-ids)
                ;; Find the NIV4 record by matching the name
                (if-let [niv4-record (->> ref-list-map
                                          vals
                                          (filter #(and (= 4 (get-in % [:fields :Niveau_record]))
                                                       (= niv4-name (get-in % [:fields :record_name]))))
                                          first)]
                  (assoc acc (:id niv4-record) (first niv3-ids))
                  acc)
                acc)))
          {}
          liens-niveaux))

(defn- extract-entity-details
  "Extract entity details from ref-list"
  [ref-list-map entity-id]
  (when-let [entity (get ref-list-map entity-id)]
    {:id entity-id
     :name (get-in entity [:fields :record_name])
     :niveau (get-in entity [:fields :Niveau_record])
     :type (get-in entity [:fields :Type_record])
     :id-record (get-in entity [:fields :ID_record])
     :exemple (get-in entity [:fields :Exemple])
     :link (get-in entity [:fields :link])
     :var-type (get-in entity [:fields :Var_type])
     :desc-fr (get-in entity [:fields :Desc_fr])}))


(defn- build-fields-for-lov
  "Build a standardized field entry for NIV3 entities"
  [all-lov lov-name]
  (let [lov-libs (->> all-lov
                       (filter (fn [{:keys [lov]}]
                                 (= lov lov-name)))
                       (map (fn [lov]
                              (assoc lov
                                     :lib (:lib_fr lov)
                                     :order (try (Double/parseDouble (str/replace (:Ordre lov) #"," "."))
                                                 (catch Exception e
                                                   nil)))))
                       (sort-by :order))]
                       
   (->> (mapv (fn [{:keys [lib order]}]
                (let [id (str lib "-" order)]
                 {:id-record id
                  :entity-id id
                  :entity-name lib
                  :niveau 2
                  :var-type ""
                  :desc lib
                  :desc-fr lib
                  :order order
                  :entity {:id id :name lib}
                  :link-entity-id nil
                  :exemple nil
                  :type (:lov entity-types)}))
              lov-libs)
        (sort-by :order))))

(defn- build-entity-entry
  "Build a standardized entity entry for any niveau level"
  [entity-id entity-details niveau]
  {:id-record (:id-record entity-details)
   :entity-name (:name entity-details)
   :niveau niveau
   :var-type (:var-type entity-details)
   :desc (:desc-fr entity-details)
   :desc-fr (:desc-fr entity-details)
   :entity-id entity-id
   :entity {:id entity-id :name (:name entity-details)}
   :link-entity-id (:link entity-details)
   :lib-group (format "Niveau %d - %s" niveau (or (:name entity-details) ""))
   :exemple (:exemple entity-details)
   :type (or (:type entity-details) (:unknown entity-types))})

(defn- process-niveau-entities
  "Process entities at any niveau level and convert to field entries"
  [entity-ids get-entity-details-fn niveau]
  (->> entity-ids
       (map (fn [entity-id]
              (when-let [entity-details (get-entity-details-fn entity-id)]
                (build-entity-entry entity-id entity-details niveau))))
       (filter some?)
       (sort-by #(normalize-string (or (:entity-name %) "")))))

(defn- find-children-ids
  "Find all child IDs for a given parent ID in a mapping"
  [parent-id child-to-parent-map]
  (->> child-to-parent-map
       (filter #(= parent-id (second %)))
       (map first)))

(defn- make-base-entity
  "Create base entity structure from entity details"
  [entity-id entity-details niveau]
  {:entity-id entity-id
   :entity-name (:name entity-details)
   :niveau niveau
   :id-record (:id-record entity-details)
   :type (:type entity-details)
   :exemple (:exemple entity-details)
   :link (:link entity-details)
   :var-type (:var-type entity-details)
   :desc-fr (:desc-fr entity-details)})

(defn- sort-entities-by-name
  "Sort entity IDs by normalized entity name"
  [entity-ids get-entity-details-fn]
  (sort-by (fn [id]
             (normalize-string
              (or (:name (get-entity-details-fn id)) "")))
           entity-ids))

;; Forward declarations for mutual recursion
(declare build-niveau2-entities build-niveau3-entities)

(defn- build-niveau3-entity
  "Build niveau 3 entity (with optional niveau 4 children for NMR types)"
  [entity-id get-entity-details-fn child-mappings]
  (let [entity-details (get-entity-details-fn entity-id)
        base-entity (make-base-entity entity-id entity-details 3)
        niv4-ids (find-children-ids entity-id (get child-mappings :niv4-to-niv3))
        niv4-fields (when (seq niv4-ids)
                      (process-niveau-entities niv4-ids get-entity-details-fn 4))]
    (if (seq niv4-fields)
      (assoc base-entity :fields niv4-fields)
      base-entity)))

(defn- build-niveau3-entities
  "Build all niveau 3 entities"
  [entity-ids get-entity-details-fn child-mappings]
  (map #(build-niveau3-entity % get-entity-details-fn child-mappings) entity-ids))

(defn- build-niveau2-entity
  "Build niveau 2 entity with niveau 3 children"
  [entity-id get-entity-details-fn child-mappings]
  (let [entity-details (get-entity-details-fn entity-id)
        base-entity (make-base-entity entity-id entity-details 2)
        niv3-ids (find-children-ids entity-id (get child-mappings :niv3-to-niv2))
        niv3-by-type (group-by (fn [id] (:type (get-entity-details-fn id))) niv3-ids)
        rio-fields (process-niveau-entities (get niv3-by-type (:rio entity-types) []) get-entity-details-fn 3)
        nmr-fields (build-niveau3-entities (get niv3-by-type (:nmr entity-types) []) get-entity-details-fn child-mappings)
        other-fields (process-niveau-entities
                      (->> (dissoc niv3-by-type (:rio entity-types) (:nmr entity-types))
                           vals
                           (apply concat))
                      get-entity-details-fn
                      3)]
    (assoc base-entity :fields (concat rio-fields nmr-fields other-fields))))

(defn- build-niveau2-entities
  "Build all niveau 2 entities"
  [entity-ids get-entity-details-fn child-mappings]
  (map #(build-niveau2-entity % get-entity-details-fn child-mappings) entity-ids))

(defn- build-niveau1-entity
  "Build niveau 1 entity (LoV or standard with niveau 2 children)"
  [entity-id get-entity-details-fn child-mappings]
  (let [entity-details (get-entity-details-fn entity-id)
        base-entity (make-base-entity entity-id entity-details 1)]
    (if (= (:type entity-details) (:lov entity-types))
      (assoc base-entity :fields (sort-by :order (build-fields-for-lov (get child-mappings :all-lov) (:name entity-details))))
      (let [niv2-ids (find-children-ids entity-id (get child-mappings :niv2-to-niv1))
            sorted-niv2-ids (sort-entities-by-name niv2-ids get-entity-details-fn)
            niv2-entries (build-niveau2-entities sorted-niv2-ids get-entity-details-fn child-mappings)]
        (assoc base-entity :fields niv2-entries)))))

(defn- build-niveau1-entities
  "Build all niveau 1 entities"
  [entity-ids get-entity-details-fn child-mappings]
  (map #(build-niveau1-entity % get-entity-details-fn child-mappings) entity-ids))

(defn- load-table-data
  "Load all required table data from files"
  []
  (let [liens-niveaux (read-file-table (:liens-niveaux table-names))
        ref-list-data (read-file-table (:ref-list table-names))
        all-lov (->> (read-file-table (:lov table-names))
                     (map :fields))
        ref-list-map (md/index-by :id ref-list-data)]
    {:liens-niveaux liens-niveaux
     :ref-list-data ref-list-data
     :ref-list-map ref-list-map
     :all-lov all-lov}))

(defn- build-child-mappings
  "Build mappings between child and parent levels"
  [liens-niveaux ref-list-map all-lov]
  {:niv2-to-niv1 (build-level-mapping liens-niveaux (:niv2 niveau-keys) (:niv1 niveau-keys))
   :niv3-to-niv2 (build-level-mapping liens-niveaux (:niv3 niveau-keys) (:niv2 niveau-keys))
   :niv4-to-niv3 (build-niv4-mapping liens-niveaux ref-list-map)
   :all-lov all-lov})

(defn- extract-niveau1-entity-ids
  "Extract and sort niveau 1 entity IDs"
  [ref-list-data get-entity-details-fn]
  (->> ref-list-data
       (filter #(= 1 (get-in % [:fields :Niveau_record])))
       (map :id)
       (sort-by (fn [id]
                  (normalize-string
                   (or (:name (get-entity-details-fn id)) ""))))))

(defn- group-and-sort-by-entity
  "Build complete hierarchical structure from table data"
  []
  (let [{:keys [liens-niveaux ref-list-data ref-list-map all-lov]} (load-table-data)
        child-mappings (build-child-mappings liens-niveaux ref-list-map all-lov)
        get-entity-details-fn (partial extract-entity-details ref-list-map)
        niveau1-entities (extract-niveau1-entity-ids ref-list-data get-entity-details-fn)]
    (build-niveau1-entities niveau1-entities get-entity-details-fn child-mappings)))

(defn get-all-referentiels []
  (->> (group-and-sort-by-entity)
       (group-by :type)))

(defn get-all-lov []
  (->> (read-file-table "lov")
       (map :fields)))

(comment
  (def s (aicn.system/get-system))
  (def auth (get s :adapter/airtable))
  (def resp1 (request auth {:method :get
                            :table-name "Liens Niveaux"}))

  (def all-base (fetch-all auth "liens niveaux"))
  (read-string (slurp "resources/data/base.edn"))
  (sync-tables auth tables)

  (def all-fields (get-all-fields))

  (def all-lov (get-all-lov))

  (->> all-lov
       (filter (fn [{:keys [lov]}]
                 (= lov "Etat de fonction des équipements")))
       (map (fn [lov]
              (assoc lov
                     :lib (:lib_fr lov)
                     :order (Integer/parseInt (:Ordre lov)))))
       (sort-by :order))

  (-> (->> (group-and-sort-by-entity)
           (group-by :type))
      (get "LoV")))







