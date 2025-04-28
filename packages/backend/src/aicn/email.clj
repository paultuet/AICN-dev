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
   (java.util Calendar Properties)))

;; Email configuration
(def email-config (atom {}))

(defn set-config! [config]
  (reset! email-config config))

(defn get-config []
  @email-config)

;; Template initialization
(defn init-templates []
  (selmer/set-resource-path! (io/resource "templates"))
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
        (doto message
          (.setFrom (InternetAddress. from))
          (.addRecipient Message$RecipientType/TO (InternetAddress. to))
          (.setSubject subject)
          (.setContent body "text/html; charset=utf-8"))
        (Transport/send message)
        {:success true})
      (catch Exception e
        (println "Failed to send email:" (.getMessage e))
        (log/error e)
        {:success false
         :error (.getMessage e)}))))

;; Get current year for email templates
(defn current-year []
  (.get (Calendar/getInstance) Calendar/YEAR))

;; Verification email
(defn build-verification-email [base-url {:keys [email verification-token name]}]
  (let [verification-url (str base-url "/verify-email?token=" verification-token)
        template-data {:name name
                       :verification-url verification-url
                       :year (current-year)}
        email-body (selmer/render-file "email/verification.html" template-data)]
    {:to email
     :subject "Vérifiez votre compte AICN"
     :body email-body}))

;; Resend verification email
(defn build-resend-verification-email [base-url {:keys [email verification-token name]}]
  (let [verification-url (str base-url "/verify-email?token=" verification-token)
        template-data {:name name
                       :verification-url verification-url
                       :year (current-year)}
        email-body (selmer/render-file "email/resend-verification.html" template-data)]
    {:to email
     :subject "Nouveau lien de vérification pour votre compte AICN"
     :body email-body}))

;; Welcome email after verification
(defn build-welcome-email [base-url {:keys [email name]}]
  (let [login-url (str base-url "/login")
        template-data {:name name
                       :login-url login-url
                       :year (current-year)}
        email-body (selmer/render-file "email/welcome.html" template-data)]
    {:to email
     :subject "Bienvenue chez AICN !"
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