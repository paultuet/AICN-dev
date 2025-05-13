(ns aicn.auth
  (:require
   [buddy.hashers :as hashers]
   [buddy.sign.jwt :as jwt]
   [clojure.string :as str]
   [java-time.api :as time]
   [aicn.core :as core]
   [aicn.db :as repo]
   [aicn.email :as email]
   [aicn.logger :as log]))

(def secret "votre-clé-secrète-très-longue")

(defn get-frontend-url [config]
  (get-in config [:frontend :url] "http://localhost:3000"))

(defn hash-password [password]
  (hashers/derive password {:alg :bcrypt+blake2b-512
                            :iterations 12}))

(defn valid-password? [plain-password hashed-password]
  (let [{:keys [valid]} (hashers/verify plain-password hashed-password)]
    valid))

(defn send-verification-email-template! 
  ([user frontend-url]
   (send-verification-email-template! user frontend-url false))
  ([user frontend-url is-resend]
   (when user
     (let [email-builder (if is-resend
                           email/build-resend-verification-email
                           email/build-verification-email)
           verification-email (email-builder frontend-url user)]
       (email/send-email! verification-email)))))

(defn create-user-with-password
  "Helper function to create a user with a plain text password that gets hashed"
  [datasource {:keys [email password name organization role verification-token verification-token-expires-at]
               :or {role "USER"}}]
  (try
    (let [password-hash (hash-password password)
          access-rights {:referenceIds [] :categoryIds []}
          user-data {:email (str/lower-case email)
                     :password-hash password-hash
                     :name name
                     :organization organization
                     :role role
                     :access-rights access-rights
                     :verification-token verification-token
                     :verification-token-expires-at verification-token-expires-at}]
      (repo/create-user datasource user-data))
    (catch Exception e
      (throw (ex-info "Failed to create user"
                      {:cause (.getMessage e)
                       :data {:email email :name name :organization organization}}
                      e)))))

(defn- generate-verification-token []
  (java.util.UUID/randomUUID))

(defn- generate-token-expiry []
  (time/plus (time/instant) (time/hours 24)))

(defn send-welcome-email [user frontend-url]
  (let [welcome-email (email/build-welcome-email frontend-url user)]
    (email/send-email! welcome-email)))

(defn send-verification-email
  ([opts]
   (send-verification-email opts {:resend? false}))
  ([{:keys [db/ds parameters config]} {:keys [resend?] :or {resend? false}}]
   (let [email (get-in parameters [:body :email])
         frontend-url (get-in config [:frontend :url] "http://localhost:3000")]
     (if (nil? email)
       {:status 400 :body {:message "Email is required"}}

       (if-let [user (repo/get-user-by-email ds email)]
         (if (:email-verified user)
           {:status 400 :body {:message "Email is already verified"}}

           (let [verification-token (generate-verification-token)
                 token-expires-at (generate-token-expiry)
                 updated-user (try
                                (repo/update-user ds {:id (:id user)
                                                      :verification-token verification-token
                                                      :verification-token-expires-at token-expires-at})
                                (catch Exception e (log/error e)))]

             ;; Send verification email
             (send-verification-email-template! 
              (assoc updated-user :verification-token verification-token)
              frontend-url
              resend?)

             {:status 200 :body {:message "Verification email sent. Please check your inbox."}}))

         {:status 404 :body {:message "User not found"}})))))

(defn login
  [{:keys [db/ds parameters config] :as opts}]
  (if (nil? parameters)
    {:status 400 :body {:message "No parameters received"}}

    (let [params  (:body parameters)
          {:keys [email password]} params]

      (if (or (nil? email) (nil? password))
        {:status 400 :body {:message "Missing email or password"}}

        (if-let [user (repo/get-user-by-email ds (str/lower-case email))]
          (if (valid-password? password (:password-hash user))
            (if (:email-verified user)
              (let [claims {:email (:email user)
                            :name (:name user)
                            :role (:role user)
                            :id (:id user)
                            :exp (time/plus (time/instant) (time/seconds 3600))}
                    token (jwt/sign claims secret {:alg :hs512})]
                {:status 200
                 :body {:token token}})
              (do
                (send-verification-email (assoc-in opts [:parameters :body :email] email))
                {:status 403
                 :body {:message "Email not verified. Please check your email to verify your account."}}))
            {:status 400
             :body {:message "wrong auth data"}})
          {:status 400
           :body {:message "wrong auth data"}})))))

(def authentication-interceptor
  {:name ::authentication
   :enter (fn [context]
            (let [request (:request context)
                  token (get-in request [:headers "authorization"])
                  token (when token (second (re-find #"^Bearer (.+)$" token)))
                  ident (when token
                          (try
                            (jwt/unsign token secret {:alg :hs512})
                            (catch Exception _
                              nil)))]
              (if ident
                (assoc-in context [:request :session/user] ident)
                context)))})

(defn restrict-role-interceptor 
  [role]
  {:name ::restrict-role-interceptor
   :enter (fn [{{:keys [session/user db/ds]} :request :as context}]
            (let [_ (println user)
                  user-db (repo/get-user-by-id ds (:id user))]
              (if (= (:role user-db) role)
                context
                (-> context
                  (assoc :response {:status 401 :body {:error "Non autorisé"}})
                  (assoc :queue nil)))))})

(def authorization-interceptor
  {:name ::authorization
   :enter (fn [context]
            (if (get-in context [:request :session/user])
              context
              (-> context
                  (assoc :response {:status 401 :body {:error "Non autorisé"}})
                  (assoc :queue nil))))})

(defn register
  [{:keys [db/ds parameters config] :as opts}]
  (if (nil? parameters)
    {:status 400 :body {:message "No parameters received"}}

    ;; Try to get params from either form or body
    (let [params (or (:form parameters)
                     (:body parameters)
                     {})
          {:keys [email password name organization]} params
          frontend-url (get-frontend-url config)]

      (if (or (nil? email) (nil? password) (nil? name) (nil? organization))
        {:status 400 :body {:message "Missing required fields"}}

        (if (repo/get-user-by-email ds (str/lower-case email))
          ;; User already exists with this email
          {:status 400
           :body {:message "Email already in use"}}

          ;; Create new user
          (try
            (log/debug "Attempting to create user...")
            (let [verification-token (generate-verification-token)
                  token-expires-at (generate-token-expiry)
                  user-data {:email email
                             :password password
                             :name name
                             :organization organization
                             :verification-token verification-token
                             :verification-token-expires-at token-expires-at}
                  user (create-user-with-password ds user-data)]

              ;; Send verification email
              (send-verification-email (assoc-in opts [:parameters :body :email] email))

              {:status 201
               :body {:message "User registered successfully. Please check your email to verify your account."
                      :user (select-keys user [:id :email :name :organization :role])}})
            (catch Exception e
              ;; Formatez l'erreur pour inclure autant d'informations que possible
              (let [error-details {:message (.getMessage e)
                                   :class (str (.getClass e))
                                   :cause (when-let [cause (.getCause e)]
                                            (.getMessage cause))}]
                {:status 500
                 :body {:error "Failed to register user"
                        :details error-details}}))))))))

(defn verify-email
  [{:keys [db/ds parameters config]}]
  (let [token (get-in parameters [:query :token])
        frontend-url (get-in config [:frontend :url] "http://localhost:3000")]
    (if (nil? token)
      {:status 400 :body {:message "Missing verification token"}}

      (if-let [user (repo/get-user-by-verification-token ds token)]
        (let [now (time/instant)
              token-expired? (time/after? now (time/instant (:verification-token-expires-at user)))]

          (if token-expired?
            {:status 400 :body {:message "Verification token has expired. Please request a new one."}}

            ;; Mark email as verified and clear token
            (do
              (repo/update-user ds {:id (:id user)
                                    :email-verified true
                                    :verification-token nil
                                    :verification-token-expires-at nil})
              (send-welcome-email user frontend-url)

              {:status 200 :body {:message "Email verified successfully. You can now log in."}})))

        {:status 404 :body {:message "Invalid verification token"}}))))



(defn routes [opts]
  ["/auth" {:openapi {:tags ["auth"]}
            :interceptors [(core/init-system-interceptor opts)]}
   ["/register" {:post {:summary "Register a new user"
                        :parameters {:body [:map
                                            [:email :string]
                                            [:password :string]
                                            [:name :string]
                                            [:organization :string]]}
                        :responses {201 {:body :any}
                                    400 {:body :any}
                                    500 {:body :any}}
                        :handler (fn [request]
                                   (register request))}}]
   ["/login" {:post {:summary "Login"
                     :parameters {:body [:map
                                         [:email :string]
                                         [:password :string]]}
                     :responses {200 {:body :any}}
                     :handler (fn [request]
                                (login request))}}]
   ["/verify-email" {:get {:summary "Verify email address"
                           :parameters {:query [:map
                                                [:token :string]]}
                           :responses {200 {:body :any}
                                       400 {:body :any}
                                       404 {:body :any}}
                           :handler (fn [request]
                                      (verify-email request))}}]
   ["/resend-verification" {:post {:summary "Resend verification email"
                                   :parameters {:body [:map
                                                       [:email :string]]}
                                   :responses {200 {:body :any}
                                               400 {:body :any}
                                               404 {:body :any}}
                                   :handler (fn [request]
                                              (send-verification-email request {:resend? true}))}}]
   ["/me" {:openapi {:tags ["auth"]}
           :interceptors [authentication-interceptor
                          authorization-interceptor]
           :responses {200 {:body :any}
                       401 {:body :any}}
           :get {:summary "Get current user information"
                 :handler (fn [request]
                            (let [user-id (get-in request [:session/user :id])
                                  ds (get-in request [:db/ds])]
                              (if-let [user (repo/get-user-by-id ds user-id)]
                                {:status 200
                                 :body (select-keys user [:id :email :name :organization :role])}
                                {:status 404
                                 :body {:error "User not found"}})))}}]])



