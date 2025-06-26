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

(defn- ->url [{:keys [app-id]} table-name]
  (str "https://api.airtable.com/v0/" app-id "/" table-name))

(defn- request [{:keys [token] :as auth} {:keys [method table-name offset]}]
  (-> (hc/request (cond-> {:url (->url auth table-name)
                           :method method
                           :headers {"Authorization" (str "Bearer " token)}}
                    offset (assoc-in [:query-params :offset] offset)))
      :body
      u/from-json))

(defn- spit-pretty [file-path data]
  (with-open [w (io/writer file-path)]
    (binding [*out* w
              *print-length* nil
              *print-level* nil]
      (pprint/pprint data))))

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

(def tables ["liens niveaux" "lov" "cat_ref" "ref_list"])

(defn get-tables-names []
  tables)

(defn- read-file-table [table]
  (read-string (slurp (io/resource (format "data/%s.edn" table)))))

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

(defn- normalize-string [s]
  (-> s
      (str/lower-case)
      ;; Remplacer les caractères accentués par leurs équivalents sans accent
      (str/replace "é" "e")
      (str/replace "è" "e")
      (str/replace "ê" "e")
      (str/replace "ë" "e")
      (str/replace "à" "a")
      (str/replace "â" "a")
      (str/replace "ä" "a")
      (str/replace "î" "i")
      (str/replace "ï" "i")
      (str/replace "ô" "o")
      (str/replace "ö" "o")
      (str/replace "ù" "u")
      (str/replace "û" "u")
      (str/replace "ü" "u")
      (str/replace "ç" "c")))

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
                 {:id-field id #_(:id-record niv3-details)
                  :entity-id id
                  :lib-fonc lib 
                  :niveau 2
                  :var-type ""
                  :order order
                  #_#_:desc lib
                  ; :entity-id niv3-id
                  ; :entity {:id niv3-id :name (:name niv3-details)}
                  ; :link-entity-id (:link niv3-details)
                  ; :lib-group (format "Niveau 3 - %s" (:name niv3-details))
                  ; :exemple (:exemple niv3-details)
                  :type "LoV"}))
              lov-libs)
        (sort-by :order))))

(defn- build-field-entry
  "Build a standardized field entry for NIV3 entities"
  [niv3-id niv3-details]
  {:id-field (:id-record niv3-details)
   :lib-fonc (:name niv3-details)
   :niveau 3
   :var-type (:var-type niv3-details)
   :desc (:desc-fr niv3-details)
   :entity-id niv3-id
   :entity {:id niv3-id :name (:name niv3-details)}
   :link-entity-id (:link niv3-details)
   :lib-group (format "Niveau 3 - %s" (:name niv3-details))
   :exemple (:exemple niv3-details)
   :type (or (:type niv3-details) "UNKNOWN")})

(defn- process-niv3-entities
  "Process NIV3 entities by type and convert to field entries"
  [niv3-ids get-entity-details-fn]
  (->> niv3-ids
       (map (fn [niv3-id]
              (when-let [niv3-details (get-entity-details-fn niv3-id)]
                (build-field-entry niv3-id niv3-details))))
       (filter some?)
       (sort-by #(normalize-string (:lib-fonc %)))))

(defn- find-children-ids
  "Find all child IDs for a given parent ID in a mapping"
  [parent-id child-to-parent-map]
  (->> child-to-parent-map
       (filter #(= parent-id (second %)))
       (map first)))

(defn- build-hierarchical-level
  "Recursively build hierarchical structure for a given level"
  [entity-ids niveau get-entity-details-fn child-mappings]
  (map (fn [entity-id]
         (let [entity-details (get-entity-details-fn entity-id)
               base-entity {:entity-id entity-id
                            :entity-name (:name entity-details)
                            :niveau niveau
                            :id-record (:id-record entity-details)
                            :type (:type entity-details)
                            :exemple (:exemple entity-details)
                            :link (:link entity-details)
                            :var-type (:var-type entity-details)
                            :desc-fr (:desc-fr entity-details)}]
           (case niveau
             1 (if (= (:type entity-details) "LoV")
                 (assoc base-entity :fields (sort-by :order (build-fields-for-lov (get child-mappings :all-lov) (:name entity-details))))
                 (let [niv2-ids (find-children-ids entity-id (get child-mappings :niv2-to-niv1))
                       sorted-niv2-ids (sort-by (fn [id]
                                                  (normalize-string
                                                   (or (:name (get-entity-details-fn id)) "")))
                                                niv2-ids)
                       niv2-entries (build-hierarchical-level sorted-niv2-ids 2 get-entity-details-fn child-mappings)]
                   (assoc base-entity :fields niv2-entries)))

             2 (let [niv3-ids (find-children-ids entity-id (get child-mappings :niv3-to-niv2))
                     niv3-by-type (group-by (fn [id] (:type (get-entity-details-fn id))) niv3-ids)
                     rio-fields (process-niv3-entities (get niv3-by-type "RIO" []) get-entity-details-fn)
                     nmr-fields (process-niv3-entities (get niv3-by-type "NMR" []) get-entity-details-fn)
                     other-fields (process-niv3-entities
                                   (->> (dissoc niv3-by-type "RIO" "NMR")
                                        vals
                                        (apply concat))
                                   get-entity-details-fn)]
                 (assoc base-entity :fields (concat rio-fields nmr-fields other-fields)))

             base-entity)))
       entity-ids))

(defn- group-and-sort-by-entity []
  (let [liens-niveaux (read-file-table "liens-niveaux")
        ref-list-data (read-file-table "ref_list")
        all-lov (->> (read-file-table "lov")
                     (map :fields))
        ref-list-map (md/index-by :id ref-list-data)

        niv3-to-niv2 (build-level-mapping liens-niveaux :NIV3 :NIV2)
        niv2-to-niv1 (build-level-mapping liens-niveaux :NIV2 :NIV1)

        get-entity-details-fn (partial extract-entity-details ref-list-map)

        niveau1-entities (->> ref-list-data
                              (filter #(= 1 (get-in % [:fields :Niveau_record])))
                              (map :id)
                              (sort-by (fn [id]
                                         (normalize-string
                                          (or (:name (get-entity-details-fn id)) "")))))

        child-mappings {:niv2-to-niv1 niv2-to-niv1
                        :niv3-to-niv2 niv3-to-niv2
                        :all-lov all-lov}]

    (build-hierarchical-level niveau1-entities 1 get-entity-details-fn child-mappings)))

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







