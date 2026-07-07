(ns aicn.adoption
  "HTTP handlers for the two adoption dashboards:
   - GET /adoption/status     — live matrix data (any authenticated user)
   - GET /adoption/programmes — live program cards + agenda (any authenticated user)
   - POST /adoption/registrations — submit participant emails (any authenticated user)
   - GET  /adoption/registrations — list submissions (admin only)

   Reads go through the live Airtable proxy (aicn.adapters.adoption); registrations
   are stored in Postgres (aicn.db) and, best-effort, notified to the admin by email."
  (:require
   [aicn.activity-logs :as activity]
   [aicn.adapters.adoption :as adopt]
   [aicn.db :as db]
   [aicn.email :as email]
   [aicn.logger :as log]
   [clojure.string :as str]
   [ring.util.response :as response]))

;; ---------------------------------------------------------------------------
;; Airtable error handling
;; ---------------------------------------------------------------------------

(defn- with-airtable-errors
  "Run f (which fetches from Airtable) and turn known failure modes into clean
   HTTP responses instead of leaking a raw Airtable 401/500 or a stacktrace."
  [f]
  (try
    (response/response (f))
    (catch clojure.lang.ExceptionInfo e
      (let [{:keys [type status body]} (ex-data e)]
        (case type
          :airtable/api-error
          (do (log/error (str "Adoption Airtable API error " status ": " body))
              {:status 502 :body {:error "Erreur Airtable" :status status}})

          :airtable/request-error
          (do (log/error (str "Adoption Airtable unreachable: " (.getMessage e)))
              {:status 502 :body {:error "Airtable injoignable"}})

          :adoption/not-configured
          {:status 503 :body {:error "Dashboards d'adoption non configurés (token Airtable manquant)."}}

          ;; unknown ex-info: let the global handler deal with it
          (throw e))))))

;; ---------------------------------------------------------------------------
;; Dashboard read endpoints
;; ---------------------------------------------------------------------------

(defn adoption-status-handler [request]
  (with-airtable-errors
    #(adopt/get-adoption-status-matrix (:adapter/adoption-airtable request))))

(defn adoption-programmes-handler [request]
  (with-airtable-errors
    #(adopt/get-adoption-programmes (:adapter/adoption-airtable request))))

;; ---------------------------------------------------------------------------
;; Registrations
;; ---------------------------------------------------------------------------

(defn- parse-int [s default]
  (if (and s (re-matches #"\d+" (str s)))
    (Integer/parseInt (str s))
    default))

(def ^:private email-re #"(?i)[^@\s]+@[^@\s]+\.[^@\s]+")

(defn- valid-email? [s]
  (and (string? s) (re-matches email-re (str/trim s))))

(defn- clean-emails [emails]
  (->> (if (sequential? emails) emails [emails])
       (map #(str/trim (str %)))
       (filter valid-email?)
       distinct
       vec))

(defn- registration->wire [r]
  {:id                (str (:id r))
   :programAirtableId (:program_airtable_id r)
   :programName       (:program_name r)
   :emails            (:emails r)
   :submittedBy       (str (:submitted_by r))
   :submittedByEmail  (:submitted_by_email r)
   :submittedByName   (:submitted_by_name r)
   :createdAt         (:created_at r)})

(defn- notify-admin-of-registration!
  "Best-effort admin email. Never throws: a mail failure must not fail the
   registration itself."
  [request user program-name emails]
  (try
    (let [admin-email (get-in request [:config :admin :email])
          base-url    (get-in request [:config :frontend :url])]
      (if (str/blank? (str admin-email))
        (log/info "Program registration: ADMIN_EMAIL not set, skipping notification email")
        (let [result (email/send-email!
                      (email/build-program-registration-email
                       base-url admin-email
                       {:program-name program-name
                        :emails emails
                        :submitter-name (:name user)
                        :submitter-email (:email user)}))]
          (when-not (:success result)
            (log/error (str "Program registration notification failed: " (:error result)))))))
    (catch Exception e
      (log/error (str "Program registration notification threw: " (.getMessage e))))))

(defn create-registration-handler [request]
  (let [ds    (:db/ds request)
        user  (:session/user request)
        {:keys [programId programName emails]} (:body-params request)
        clean (clean-emails emails)]
    (cond
      (str/blank? (str programId))
      (response/bad-request {:error "programId est obligatoire"})

      (empty? clean)
      (response/bad-request {:error "Au moins une adresse email valide est requise"})

      :else
      (let [rec (db/create-program-registration
                 ds {:program-airtable-id programId
                     :program-name programName
                     :emails clean
                     :submitted-by (:id user)})]
        (activity/add-activity-log! ds {:type :program-registration-created
                                        :user-email (:email user)
                                        :user-name (:name user)
                                        :user-id (:id user)
                                        :message "Program registration submitted"
                                        :details {:program-id programId
                                                  :program-name programName
                                                  :count (count clean)}})
        (notify-admin-of-registration! request user programName clean)
        (response/response (registration->wire rec))))))

(defn list-registrations-handler [request]
  (let [ds     (:db/ds request)
        limit  (min 500 (parse-int (get-in request [:query-params "limit"]) 100))
        offset (parse-int (get-in request [:query-params "offset"]) 0)]
    (response/response
     {:registrations (mapv registration->wire
                           (db/get-program-registrations ds {:limit limit :offset offset}))})))
