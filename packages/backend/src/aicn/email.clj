(ns aicn.email
  (:require
   [aicn.logger :as log]
   [clojure.java.io :as io]
   [clojure.string :as str]
   [integrant.core :as ig]
   [selmer.parser :as selmer])
  (:import
   (jakarta.mail
    Authenticator
    Message$RecipientType
    PasswordAuthentication
    Session
    Transport)
   (jakarta.mail.internet InternetAddress MimeMessage)
   (java.util Calendar Date Properties)))

;; Email configuration
(def email-config (atom {}))

(defn set-config! [config]
  (reset! email-config config))

(defn get-config []
  @email-config)

;; Template initialization
(defn init-templates []
  (selmer/set-resource-path! (io/resource "templates/emails-html"))
  ;; Add custom filters if needed
  (selmer/add-filter! :uppercase (fn [s] (str/upper-case s))))

;; Session creation
(defn- create-session [{:keys [host port username password tls]}]
  (let [props (Properties.)]
    (doto props
      (.put "mail.smtp.host" host)
      (.put "mail.smtp.port" (str port))
      (.put "mail.smtp.auth" "true")
      (.put "mail.smtp.starttls.enable" (str (boolean tls))))
    
    (Session/getInstance props
                        (proxy [Authenticator] []
                          (getPasswordAuthentication []
                            (PasswordAuthentication. username password))))))

;; Email sending
(defn send-email! [{:keys [to subject body]}]
  (let [{:keys [from session]} (get-config)]
    (try
      (let [message (MimeMessage. session)]
        (.setFrom message (InternetAddress. from))
        (.addRecipient message Message$RecipientType/TO (InternetAddress. to))
        ;; RFC 2047 encode the subject so non-ASCII characters (em-dashes, accents,
        ;; etc.) survive transport and don't get flagged by spam filters.
        (.setSubject message subject "UTF-8")
        (.setContent message body "text/html; charset=utf-8")
        ;; Set a Date header explicitly. Without it many MTAs and spam filters
        ;; penalize the message.
        (.setSentDate message (Date.))
        ;; Force MimeMessage to compute headers including a Message-ID. Spam
        ;; filters mark messages without one as suspicious.
        (.saveChanges message)
        (Transport/send message)
        (log/info (str "Email sent - To: " to " - Subject: " subject))
        {:success true})
      (catch Exception e
        ;; Surface the exception class as well as the message: it distinguishes SMTP auth
        ;; failures (AuthenticationFailedException) from connection problems
        ;; (MessagingException) from rejected recipients (SendFailedException), which is the
        ;; first thing you need to know when a verification email silently fails to go out.
        (log/error (str "Failed to send email - To: " to
                        " - Subject: " subject
                        " - Class: " (.getName (class e))
                        " - Error: " (.getMessage e)))
        {:success false
         :error (.getMessage e)
         :class (.getName (class e))}))))

;; Get current year for email templates
(defn current-year []
  (.get (Calendar/getInstance) Calendar/YEAR))

;; Verification email
(defn build-verification-email [base-url {:keys [email verification-token name]}]
  (let [verification-url (str base-url "/verify-email?token=" verification-token)
        template-data {:name name
                       :verification-url verification-url
                       :year (current-year)}
        email-body (selmer/render-file "verification.html" template-data)]
    {:to email
     :subject "Vérifiez votre compte AICN"
     :body email-body}))

;; Resend verification email
(defn build-resend-verification-email [base-url {:keys [email verification-token name]}]
  (let [verification-url (str base-url "/verify-email?token=" verification-token)
        template-data {:name name
                       :verification-url verification-url
                       :year (current-year)}
        email-body (selmer/render-file "resend-verification.html" template-data)]
    {:to email
     :subject "Nouveau lien de vérification pour votre compte AICN"
     :body email-body}))

;; Welcome email after verification
(defn build-welcome-email [base-url {:keys [email name]}]
  (let [login-url (str base-url "/login")
        template-data {:name name
                       :login-url login-url
                       :year (current-year)}
        email-body (selmer/render-file "welcome.html" template-data)]
    {:to email
     :subject "Bienvenue chez AICN !"
     :body email-body}))

;; Password reset email
(defn build-password-reset-email [base-url {:keys [email name reset-token]}]
  (let [reset-url (str base-url "/reset-password/" reset-token)
        template-data {:name name
                       :reset-url reset-url
                       :year (current-year)}
        email-body (selmer/render-file "password-reset.html" template-data)]
    {:to email
     :subject "Réinitialisation de votre mot de passe AICN"
     :body email-body}))

;; Admin approval request email
(defn build-admin-approval-request-email [base-url admin-email {:keys [email name organization]} approve-url]
  (let [admin-url (str base-url "/admin")
        template-data {:name name
                       :email email
                       :organization organization
                       :admin-url admin-url
                       :approve-url approve-url
                       :year (current-year)}
        email-body (selmer/render-file "admin-approval-request.html" template-data)]
    {:to admin-email
     :subject (str "AICN — Nouvel utilisateur en attente d'approbation : " name)
     :body email-body}))

;; Program registration notification (adoption dashboards → admin)
(defn build-program-registration-email
  [base-url admin-email {:keys [program-name organizations submitter-name submitter-email]}]
  (let [template-data {:program-name program-name
                       :organizations organizations
                       :submitter-name submitter-name
                       :submitter-email submitter-email
                       :admin-url (str base-url "/admin")
                       :year (current-year)}
        email-body (selmer/render-file "program-registration.html" template-data)]
    {:to admin-email
     :subject (str "AICN — Nouvelle inscription au programme : " program-name)
     :body email-body}))

;; Account approved email
(defn build-account-approved-email [base-url {:keys [email name]}]
  (let [login-url (str base-url "/login")
        template-data {:name name
                       :login-url login-url
                       :year (current-year)}
        email-body (selmer/render-file "account-approved.html" template-data)]
    {:to email
     :subject "Votre compte AICN a été approuvé !"
     :body email-body}))

;; Integrant initialization
(defmethod ig/init-key :email/sender [_ config]
  (let [session (create-session config)]
    (set-config! (assoc config :session session))
    (init-templates)
    {:config config}))

(defmethod ig/halt-key! :email/sender [_ _]
  (reset! email-config {}))


(comment
  (build-resend-verification-email "http://localhost:3000" {:email "carvalho.thomas@gmail.com"}))
