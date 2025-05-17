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

(defn- group-and-sort-by-entity [data]
  (let [;; Get liens-niveaux data for relationships
        liens-niveaux (read-file-table "liens-niveaux")
        ;; Get all reference data
        ref-list-data (read-file-table "ref_list")
        ;; Index ref_list by id for quick lookup
        ref-list-map (md/index-by :id ref-list-data)

        ;; Create mappings for parent-child relationships
        ;; Map NIV3 -> NIV2
        niv3-to-niv2 (reduce (fn [acc link]
                               (let [niv3-ids (get-in link [:fields :NIV3])
                                     niv2-ids (get-in link [:fields :NIV2])]
                                 (if (and niv3-ids niv2-ids)
                                   (reduce (fn [a niv3-id]
                                             (assoc a niv3-id (first niv2-ids)))
                                           acc
                                           niv3-ids)
                                   acc)))
                             {}
                             liens-niveaux)

        ;; Map NIV2 -> NIV1
        niv2-to-niv1 (reduce (fn [acc link]
                               (let [niv2-ids (get-in link [:fields :NIV2])
                                     niv1-ids (get-in link [:fields :NIV1])]
                                 (if (and niv2-ids niv1-ids)
                                   (reduce (fn [a niv2-id]
                                             (assoc a niv2-id (first niv1-ids)))
                                           acc
                                           niv2-ids)
                                   acc)))
                             {}
                             liens-niveaux)

        ;; Function to get entity details from ref-list
        get-entity-details (fn [entity-id]
                             (when-let [entity (get ref-list-map entity-id)]
                               {:id entity-id
                                :name (get-in entity [:fields :record_name])
                                :niveau (get-in entity [:fields :Niveau_record])
                                :type (get-in entity [:fields :Type_record])
                                :id-record (get-in entity [:fields :ID_record])
                                :exemple (get-in entity [:fields :Exemple])
                                :link (get-in entity [:fields :link])  ;; Fixed field path
                                :var-type (get-in entity [:fields :Var_type])  ;; Fixed field path
                                :desc-fr (get-in entity [:fields :Desc_fr])}))  ;; Fixed field path

;; Get all NIV1 entities
        niveau1-entities (->> ref-list-data
                              (filter #(= 1 (get-in % [:fields :Niveau_record])))
                              (map :id)
                              (sort-by (fn [id]
                                         (normalize-string
                                          (or (:name (get-entity-details id)) "")))))]

    ;; Build hierarchical structure
    (reduce (fn [acc niv1-id]
              (let [niv1-details (get-entity-details niv1-id)
                    ;; Find all NIV2 that have this NIV1 as parent
                    niv2-ids (map first (filter #(= niv1-id (second %)) niv2-to-niv1))
                    ;; Sort NIV2 by name
                    sorted-niv2-ids (sort-by (fn [id]
                                               (normalize-string
                                                (or (:name (get-entity-details id)) "")))
                                             niv2-ids)
                    ;; Process each NIV2
                    niv2-entries (map (fn [niv2-id]
                                        (let [niv2-details (get-entity-details niv2-id)
                                              ;; Find all NIV3 that have this NIV2 as parent
                                              niv3-ids (map first (filter #(= niv2-id (second %)) niv3-to-niv2))
                                              ;; Group NIV3 by type
                                              niv3-by-type (group-by (fn [id]
                                                                       (get-in (get-entity-details id) [:type]))
                                                                     niv3-ids)
                                              ;; Get RIO type NIV3s (directly as fields)
                                              rio-niv3s (->> (get niv3-by-type "RIO" [])
                                                             (map (fn [niv3-id]
                                                                    (let [niv3-details (get-entity-details niv3-id)]
                                                                      {:id-field (:id-record niv3-details)
                                                                       :lib-fonc (:name niv3-details)
                                                                       :niveau 3
                                                                       :var-type (:var-type niv3-details)
                                                                       :desc (:desc-fr niv3-details)
                                                                       :entity-id niv3-id
                                                                       :entity {:id niv3-id
                                                                                :name (:name niv3-details)}
                                                                       :link-entity-id (:link niv3-details)
                                                                       :lib-group (format "Niveau 3 - %s" (:name niv3-details))
                                                                       :exemple (:exemple niv3-details)
                                                                       :type "RIO"})))
                                                             (sort-by #(normalize-string (:lib-fonc %))))
                                              ;; Get NMR type NIV3s (also as fields)
                                              nmr-niv3s (->> (get niv3-by-type "NMR" [])
                                                             (map (fn [niv3-id]
                                                                    (let [niv3-details (get-entity-details niv3-id)]
                                                                      {:id-field (:id-record niv3-details)
                                                                       :lib-fonc (:name niv3-details)
                                                                       :niveau 3
                                                                       :var-type (:var-type niv3-details)
                                                                       :desc (:desc-fr niv3-details)
                                                                       :entity-id niv3-id
                                                                       :entity {:id niv3-id
                                                                                :name (:name niv3-details)}
                                                                       :link-entity-id (:link niv3-details)
                                                                       :lib-group (format "Niveau 3 - %s" (:name niv3-details))
                                                                       :exemple (:exemple niv3-details)
                                                                       :type "NMR"})))
                                                             (sort-by #(normalize-string (:lib-fonc %))))
                                              ;; Get all other NIV3s (with any type)
                                              other-niv3s (->> (vals (dissoc niv3-by-type "RIO" "NMR"))
                                                               (apply concat)
                                                               (map (fn [niv3-id]
                                                                      (let [niv3-details (get-entity-details niv3-id)
                                                                            type-value (or (:type niv3-details) "UNKNOWN")]
                                                                        {:id-field (:id-record niv3-details)
                                                                         :lib-fonc (:name niv3-details)
                                                                         :niveau 3
                                                                         :var-type (:var-type niv3-details)
                                                                         :desc (:desc-fr niv3-details)
                                                                         :entity-id niv3-id
                                                                         :entity {:id niv3-id
                                                                                  :name (:name niv3-details)}
                                                                         :link-entity-id (:link niv3-details)
                                                                         :lib-group (format "Niveau 3 - %s" (:name niv3-details))
                                                                         :exemple (:exemple niv3-details)
                                                                         :type type-value})))
                                                               (sort-by #(normalize-string (:lib-fonc %))))]
                                          {:entity-id niv2-id
                                           :entity-name (:name niv2-details)
                                           :niveau 2
                                           :id-record (:id-record niv2-details)
                                           :type (:type niv2-details)
                                           :exemple (:exemple niv2-details)
                                           :link (:link niv2-details)
                                           :var-type (:var-type niv2-details)
                                           :desc-fr (:desc-fr niv2-details)
                                           :fields (concat rio-niv3s nmr-niv3s other-niv3s)}))
                                      sorted-niv2-ids)]
                (conj acc
                      {:entity-id niv1-id
                       :entity-name (:name niv1-details)
                       :niveau 1
                       :id-record (:id-record niv1-details)
                       :var-type (:var-type niv1-details)
                       :link (:link niv1-details)
                       :type (:type niv1-details)
                       :desc-fr (:desc-fr niv1-details)
                       :exemple (:exemple niv1-details)
                       :fields niv2-entries})))
            []
            niveau1-entities)))

(defn get-all-referentiels []
  (->> (get-all-fields)
       group-and-sort-by-entity
       (group-by :type)))

(comment
  (def s (aicn.system/get-system))
  (def auth (get s :adapter/airtable))
  (def resp1 (request auth {:method :get
                            :table-name "Liens Niveaux"}))

  (def all-base (fetch-all auth "liens niveaux"))
  (read-string (slurp "resources/data/base.edn"))
  (sync-tables auth tables)

  (def all-fields (get-all-fields))

  (->> all-fields
     group-and-sort-by-entity
     (group-by :type)))







