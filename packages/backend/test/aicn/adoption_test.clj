(ns aicn.adoption-test
  "Unit tests for the adoption dashboards' pure transforms and helpers.
   Airtable network access is stubbed via with-redefs on airtable/fetch-all,
   with fixtures that mimic the real jsonista key format (spaces -> dashes,
   accents/case/parentheses preserved)."
  (:require
   [clojure.test :refer [deftest is testing]]
   [aicn.adapters.airtable :as airtable]
   [aicn.adapters.adoption :as adopt]
   [aicn.adoption :as adoption]))

;; --- Fixtures (keys as produced by aicn.utils/from-json) ---

(def ^:private k-desc  (keyword "Description-du-programme"))
(def ^:private k-contenu (keyword "Contenu-des-travaux"))
(def ^:private k-logist  (keyword "Logistique-et-réunions"))
(def ^:private k-pgmnm (keyword "Name-(from-pgm_adopt)"))
(def ^:private k-type  (keyword "Type-de-métier-(from-Company)"))
(def ^:private k-logo  (keyword "Logo-(from-Company)"))
(def ^:private k-metier (keyword "Métier-(from-Company)"))
(def ^:private k-coname (keyword "Name-(from-Company)"))

;; RANK deliberately out of source order: recPgm2 (1) must sort before recPgm1 (2).
(def ^:private pgm-records
  [{:id "recPgm1" :fields {:Name "Adoption Data Spaces" :RANK 2
                           :Objectif "obj DS"
                           k-desc "desc DS" k-contenu "contenu DS"
                           :Cible "cible DS" :Livrables "liv DS"
                           :Communication "comm DS" k-logist "logist DS"}}
   {:id "recPgm2" :fields {:Name "Adoption métier des référentiels d'interopérabilité" :RANK 1}}])

(def ^:private logo-attachment
  {:url "https://full/url.png"
   :filename "Vinci Facilities.png"
   :thumbnails {:small {:url "https://thumb/small.png"}
                :large {:url "https://thumb/large.png"}}})

(def ^:private dash-records
  [;; full row: linked program, logo, Métier
   {:id "recD1" :fields {:statut "Participation" :pgm_adopt ["recPgm1"]
                         k-pgmnm ["Adoption Data Spaces"]
                         k-type ["Métier"]
                         k-logo [logo-attachment]}}
   ;; no logo -> companyName falls back to Métier (from Company)
   {:id "recD2" :fields {:statut "Information" :pgm_adopt ["recPgm2"]
                         k-pgmnm ["Adoption métier des référentiels d'interopérabilité"]
                         k-type ["Tech"]
                         k-metier ["Beeldi métier"]}}
   ;; explicit company-name lookup wins over filename/metier
   {:id "recD3" :fields {:statut "Test" :pgm_adopt ["recPgm1"]
                         k-type ["Métier"]
                         k-coname ["Covéa"]
                         k-logo [logo-attachment]}}])

(def ^:private agenda-records
  [{:id "recE2" :fields {:pgm_adopt ["recPgm1"] :num_event 2
                         :titre_event "Second" :Date "2026-07-15T14:00:00.000Z"}}
   {:id "recE1" :fields {:pgm_adopt ["recPgm1"] :num_event 1
                         :titre_event "First" :Date "2026-06-01T09:00:00.000Z"}}])

(defn- stub-fetch [table-id]
  (condp = table-id
    adopt/table-pgm-adopt pgm-records
    adopt/table-dash-adopt dash-records
    adopt/table-agenda agenda-records
    []))

(def ^:private auth {:token "tok" :app-id "app"})

;; --- Dashboard 1: status matrix ---

(deftest status-matrix-shape
  (with-redefs [airtable/fetch-all (fn [_ table-id] (stub-fetch table-id))]
    (let [{:keys [programs rows]} (adopt/get-adoption-status-matrix auth)]
      (testing "programs list mirrors the referential, sorted by RANK"
        (is (= [{:id "recPgm2" :name "Adoption métier des référentiels d'interopérabilité" :rank 1}
                {:id "recPgm1" :name "Adoption Data Spaces" :rank 2}]
               programs)))
      (testing "a full row is normalized correctly"
        (let [r (first (filter #(= "recD1" (:id %)) rows))]
          (is (= "recPgm1" (:programId r)))
          (is (= "Adoption Data Spaces" (:programName r)))
          (is (= "Participation" (:statut r)))
          (is (= "Métier" (:typeMetier r)))
          (is (= "Vinci Facilities" (:companyName r)) "companyName from logo filename")
          (is (= "https://thumb/large.png" (:logoUrl r)) "prefers the large thumbnail")))
      (testing "companyName falls back to Métier (from Company) when no logo"
        (let [r (first (filter #(= "recD2" (:id %)) rows))]
          (is (= "Beeldi métier" (:companyName r)))
          (is (nil? (:logoUrl r)))))
      (testing "explicit Name (from Company) lookup wins"
        (let [r (first (filter #(= "recD3" (:id %)) rows))]
          (is (= "Covéa" (:companyName r))))))))

;; --- Dashboard 2: programmes + agenda ---

(deftest programmes-shape
  (with-redefs [airtable/fetch-all (fn [_ table-id] (stub-fetch table-id))]
    (let [{:keys [programmes]} (adopt/get-adoption-programmes auth)
          ds (first (filter #(= "recPgm1" (:id %)) programmes))
          empty-pgm (first (filter #(= "recPgm2" (:id %)) programmes))]
      (testing "programmes are ordered by RANK"
        (is (= ["recPgm2" "recPgm1"] (mapv :id programmes))))
      (testing "program fields are mapped"
        (is (= "Adoption Data Spaces" (:name ds)))
        (is (= "obj DS" (:objectif ds)))
        (is (= "desc DS" (:description ds)))
        (is (= "contenu DS" (:contenuTravaux ds)))
        (is (= "cible DS" (:cible ds)))
        (is (= "liv DS" (:livrables ds)))
        (is (= "comm DS" (:communication ds)))
        (is (= "logist DS" (:logistique ds))))
      (testing "events are attached to their program and sorted by numEvent"
        (is (= [1 2] (mapv :numEvent (:events ds))))
        (is (= ["First" "Second"] (mapv :titre (:events ds)))))
      (testing "a program with no events has an empty vector"
        (is (= [] (:events empty-pgm)))))))

;; --- Case/accent-insensitive field lookup (spec §4.1) ---

(def ^:private drift-dash
  ;; same fields as a normal row but with case/accent-drifted labels
  [{:id "recX" :fields {:STATUT "Test"                              ; upper-cased
                        :pgm_adopt ["recPgm1"]
                        (keyword "Type-de-Metier-(from-Company)") ["Tech"] ; accent dropped
                        (keyword "logo-(from-company)") [logo-attachment]}}]) ; lower-cased

(deftest field-lookup-tolerates-drift
  (with-redefs [airtable/fetch-all (fn [_ table-id]
                                     (if (= table-id adopt/table-dash-adopt) drift-dash pgm-records))]
    (let [r (first (:rows (adopt/get-adoption-status-matrix auth)))]
      (testing "drifted field labels still resolve"
        (is (= "Test" (:statut r)))
        (is (= "Tech" (:typeMetier r)))
        (is (= "https://thumb/large.png" (:logoUrl r)))))))

;; --- Guards ---

(deftest not-configured-guard
  (testing "nil token throws :adoption/not-configured before any fetch"
    (is (thrown-with-msg? clojure.lang.ExceptionInfo #"not configured"
          (adopt/get-adoption-status-matrix {:token nil :app-id "app"})))
    (is (= :adoption/not-configured
           (try (adopt/get-adoption-status-matrix {:token "" :app-id "app"})
                (catch clojure.lang.ExceptionInfo e (:type (ex-data e))))))))

;; --- Registration organization cleaning (private fn accessed via var) ---

(deftest organization-cleaning
  (let [clean @#'adoption/clean-organizations]
    (testing "trims, drops blanks, de-duplicates (no email format required)"
      (is (= ["ACME Corp" "Beeldi"]
             (clean ["ACME Corp" " ACME Corp " "Beeldi" "Beeldi" "  " ""]))))
    (testing "returns empty when everything is blank"
      (is (= [] (clean ["" "   "]))))
    (testing "accepts a single non-collection value"
      (is (= ["Solo Org"] (clean "Solo Org"))))))
