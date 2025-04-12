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
      (spit-pretty (io/resource (format "data/%s.edn" table)) data))))

(def tables ["base" "lov" "cat_ref" "ref_list"])

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
  (let [base-table (read-file-table "base")
        cat-ref-map (md/index-by :id (read-file-table "cat_ref"))
        ref-list-map (md/index-by :id (read-file-table "ref_list"))
        lov-table (read-file-table "lov")]
    (->> (m/search base-table
                  (m/scan {:fields {:desc_fr ?desc
                                    :link_entity (m/or [!link-entity-id] nil),
                                    :lib_group ?lib-group
                                    :lib_fonc_fr ?lib-fonc
                                    :cat_ref [?category-id],
                                    :Identifiant-unique-du-champ ?id-field,
                                    :var_type ?var-type,
                                    :entity [?entity-id]}})
                  {:desc ?desc
                   :link-entity-id (first !link-entity-id)
                   :lib-group ?lib-group
                   :lib-fonc ?lib-fonc
                   :category-id ?category-id
                   :category (get-category cat-ref-map ?category-id)
                   :id-field ?id-field
                   :var-type ?var-type
                   :entity-id ?entity-id
                   :entity (get-entity ref-list-map ?entity-id)})
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
  ;; Regrouper par entity-id
  (let [grouped (group-by #(get-in % [:entity :id]) data)
        ;; Pour chaque groupe, trier les éléments par :id-field
        sorted-groups (reduce-kv (fn [acc k v]
                                   (assoc acc k (sort-by :id-field v)))
                                 {}
                                 grouped)
        ;; Convertir en séquence de paires [entity-id, fields] pour faciliter l'affichage
        result-seq (map (fn [[entity-id fields]]
                          {:entity-id entity-id
                           :entity-name (get-in (first fields) [:entity :name])
                           :fields (vec fields)}) 
                        sorted-groups)
        ;; Trier les entités par leur nom NORMALISÉ pour ignorer les accents et la casse
        sorted-result (sort-by #(normalize-string (:entity-name %)) result-seq)]
    sorted-result))

(defn get-all-referentiels []
  (->> (get-all-fields)
       group-and-sort-by-entity
       (into [])))

(comment
  (def s (aicn.system/get-system))
  (def auth (get s :adapter/airtable))
  (def resp1 (request auth {:method :get
                            :table-name "base"}))

  (def all-base (fetch-all auth "base"))
  (read-string (slurp "resources/data/base.edn"))
  (sync auth tables)

  (def all-fields (get-all-fields))
  
  (->> all-fields
       group-and-sort-by-entity))






