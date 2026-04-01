(ns aicn.auth
  (:require
   [buddy.hashers :as hashers]
   [buddy.sign.jwt :as jwt]
   [clojure.string :as str]
   [java-time.api :as time]
   [aicn.activity-logs :as activity]
   [aicn.core :as core]
   [aicn.db :as repo]
   [aicn.email :as email]
   [aicn.logger :as log]))

(defn get-jwt-secret [auth-jwt-config]
  (or (:secret auth-jwt-config)
      (throw (ex-info "JWT secret is required but not set in :auth/jwt configuration"
                      {:config-key :auth/jwt}))))

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

(defn- generate-reset-token []
  (java.util.UUID/randomUUID))

(defn- generate-reset-token-expiry []
  (time/plus (time/instant) (time/hours 1)))

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
                                (repo/set-verification-token ds {:id (:id user)
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
  [{:keys [db/ds parameters config auth/jwt] :as opts}]
  (if (nil? parameters)
    {:status 400 :body {:message "No parameters received"}}

    (let [params  (:body parameters)
          {:keys [email password]} params]

      (if (or (nil? email) (nil? password))
        {:status 400 :body {:message "Missing email or password"}}

        (if-let [user (repo/get-user-by-email ds (str/lower-case email))]
          (if (valid-password? password (:password-hash user))
            (if (:email-verified user)
              (if (:approved user)
                (let [claims {:email (:email user)
                              :name (:name user)
                              :role (:role user)
                              :id (:id user)
                              :exp (time/plus (time/instant) (time/seconds 3600))}
                      token (jwt/sign claims (get-jwt-secret jwt) {:alg :hs512})]
                  (log/info (str "User login successful - Email: " (:email user)
                                " - Name: " (:name user)
                                " - Organization: " (:organization user)
                                " - Time: " (time/instant)))
                  (activity/add-activity-log! ds {:type :login-success
                                                  :user-email (:email user)
                                                  :user-name (:name user)
                                                  :user-id (:id user)
                                                  :message "User logged in successfully"
                                                  :details {:organization (:organization user)}})
                  {:status 200
                   :body {:token token}})
                (do
                  (log/warn (str "Login failed - Account pending approval - Email: " (:email user)
                                " - Time: " (time/instant)))
                  (activity/add-activity-log! ds {:type :login-failed
                                                  :user-email (:email user)
                                                  :user-name (:name user)
                                                  :user-id (:id user)
                                                  :message "Login failed - Account pending approval"
                                                  :details {:reason "pending-approval"}})
                  {:status 403
                   :body {:message "Votre compte est en attente d'approbation par un administrateur."
                          :reason "pending-approval"}}))
              (do
                (log/warn (str "Login failed - Email not verified - Email: " (:email user)
                              " - Time: " (time/instant)))
                (activity/add-activity-log! ds {:type :login-failed
                                                :user-email (:email user)
                                                :user-name (:name user)
                                                :user-id (:id user)
                                                :message "Login failed - Email not verified"
                                                :details {:reason "email-not-verified"}})
                (send-verification-email (assoc-in opts [:parameters :body :email] email))
                {:status 403
                 :body {:message "Email not verified. Please check your email to verify your account."}}))
            (do
              (log/warn (str "Login failed - Invalid password - Email: " email
                            " - Time: " (time/instant)))
              (activity/add-activity-log! ds {:type :login-failed
                                              :user-email email
                                              :user-name nil
                                              :user-id nil
                                              :message "Login failed - Invalid password"
                                              :details {:reason "invalid-password"}})
              {:status 400
               :body {:message "wrong auth data"}}))
          (do
            (log/warn (str "Login failed - User not found - Email: " email
                          " - Time: " (time/instant)))
            (activity/add-activity-log! ds {:type :login-failed
                                            :user-email email
                                            :user-name nil
                                            :user-id nil
                                            :message "Login failed - User not found"
                                            :details {:reason "user-not-found"}})
            {:status 400
             :body {:message "wrong auth data"}}))))))

(defn authentication-interceptor [jwt-config]
  {:name ::authentication
   :enter (fn [context]
            (let [request (:request context)
                  token (get-in request [:headers "authorization"])
                  token (when token (second (re-find #"^Bearer (.+)$" token)))
                  ident (when token
                          (try
                            (jwt/unsign token (get-jwt-secret jwt-config) {:alg :hs512})
                            (catch Exception _
                              nil)))]
              (if ident
                (assoc-in context [:request :session/user] ident)
                context)))})

(defn restrict-role-interceptor 
  [role-param]
  {:name ::restrict-role-interceptor
   :enter (fn [{{:keys [session/user db/ds]} :request :as context}]
            (let [role (if (keyword? role-param) (name role-param) role-param)
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

(defn- generate-approval-token [user-id jwt-secret]
  (let [claims {:user-id (str user-id)
                :action "approve"
                :exp (time/plus (time/instant) (time/hours 48))}]
    (jwt/sign claims jwt-secret {:alg :hs512})))

(defn verify-email
  [{:keys [db/ds parameters config auth/jwt]}]
  (let [token (get-in parameters [:query :token])
        frontend-url (get-in config [:frontend :url] "http://localhost:3000")
        admin-email (get-in config [:admin :email])
        jwt-secret (get-jwt-secret jwt)]
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
                                    :email-verified true})
              (repo/clear-verification-token ds (:id user))

              ;; Send approval request email to admin with one-click approve link
              (when admin-email
                (let [approval-token (generate-approval-token (:id user) jwt-secret)
                      approve-url (str frontend-url "/admin/approve?token=" approval-token)
                      approval-email (email/build-admin-approval-request-email frontend-url admin-email user approve-url)]
                  (email/send-email! approval-email)))

              {:status 200 :body {:message "Email vérifié avec succès. Votre compte est en attente d'approbation par un administrateur."}})))

        {:status 404 :body {:message "Invalid verification token"}}))))

(defn approve-user
  [{:keys [db/ds parameters config]}]
  (let [user-id (get-in parameters [:path :id])
        frontend-url (get-frontend-url config)]
    (if (nil? user-id)
      {:status 400 :body {:message "Missing user ID"}}

      (if-let [user (repo/get-user-by-id ds user-id)]
        (if (:approved user)
          {:status 400 :body {:message "User is already approved"}}

          (do
            (repo/update-user ds {:id (:id user)
                                  :approved true})

            ;; Send account approved email to user
            (let [approved-email (email/build-account-approved-email frontend-url user)]
              (email/send-email! approved-email))

            ;; Log the activity
            (activity/add-activity-log! ds {:type :user-approved
                                            :user-email (:email user)
                                            :user-name (:name user)
                                            :user-id (:id user)
                                            :message "User account approved by admin"
                                            :details {:organization (:organization user)}})

            (log/info (str "User approved - Email: " (:email user)
                          " - Name: " (:name user)
                          " - Time: " (time/instant)))

            {:status 200 :body {:message "User approved successfully"}}))

        {:status 404 :body {:message "User not found"}}))))

(defn approve-user-by-token
  [{:keys [db/ds parameters config auth/jwt]}]
  (let [token (get-in parameters [:query :token])
        frontend-url (get-frontend-url config)
        jwt-secret (get-jwt-secret jwt)]
    (if (nil? token)
      {:status 400 :body {:message "Missing approval token"}}

      (let [claims (try
                     (jwt/unsign token jwt-secret {:alg :hs512})
                     (catch Exception _ nil))]
        (if (or (nil? claims) (not= (:action claims) "approve"))
          {:status 400 :body {:message "Invalid or expired approval token"}}

          (let [user-id (:user-id claims)]
            (if-let [user (repo/get-user-by-id ds user-id)]
              (if (:approved user)
                {:status 200 :body {:message "Ce compte a déjà été approuvé."}}

                (do
                  (repo/update-user ds {:id (:id user)
                                        :approved true})

                  (let [approved-email (email/build-account-approved-email frontend-url user)]
                    (email/send-email! approved-email))

                  (activity/add-activity-log! ds {:type :user-approved
                                                  :user-email (:email user)
                                                  :user-name (:name user)
                                                  :user-id (:id user)
                                                  :message "User account approved via email link"
                                                  :details {:organization (:organization user)}})

                  (log/info (str "User approved via email link - Email: " (:email user)
                                " - Name: " (:name user)
                                " - Time: " (time/instant)))

                  {:status 200 :body {:message "Utilisateur approuvé avec succès."}}))

              {:status 404 :body {:message "User not found"}})))))))

(defn forgot-password
  [{:keys [db/ds parameters config]}]
  (let [email (get-in parameters [:body :email])
        frontend-url (get-frontend-url config)]
    (if (nil? email)
      {:status 400 :body {:message "Email is required"}}
      
      (if-let [user (repo/get-user-by-email ds (str/lower-case email))]
        (if-not (:email-verified user)
          ;; Don't reveal that the email exists but is unverified
          {:status 200 :body {:message "Password reset email sent. Please check your inbox."}}

          (let [reset-token (generate-reset-token)
                token-expires-at (generate-reset-token-expiry)
                updated-user (try
                               (repo/set-reset-token ds {:id (:id user)
                                                         :reset-token reset-token
                                                         :reset-token-expires-at token-expires-at})
                               (catch Exception e (log/error e)))]
            
            ;; Send password reset email
            (let [reset-email (email/build-password-reset-email frontend-url 
                                                                (assoc updated-user :reset-token reset-token))]
              (email/send-email! reset-email))
            
            {:status 200 :body {:message "Password reset email sent. Please check your inbox."}}))
        
        ;; Don't reveal if email exists or not for security
        {:status 200 :body {:message "Password reset email sent. Please check your inbox."}}))))

(defn reset-password
  [{:keys [db/ds parameters]}]
  (let [token (get-in parameters [:body :token])
        new-password (get-in parameters [:body :password])]
    (if (or (nil? token) (nil? new-password))
      {:status 400 :body {:message "Token and new password are required"}}
      
      (if-let [user (repo/get-user-by-reset-token ds token)]
        (let [now (time/instant)
              token-expired? (time/after? now (time/instant (:reset-token-expires-at user)))]
          
          (if token-expired?
            {:status 400 :body {:message "Reset token has expired. Please request a new one."}}
            
            ;; Update password and clear reset token
            (do
              (repo/update-user ds {:id (:id user)
                                    :password-hash (hash-password new-password)})
              (repo/clear-reset-token ds (:id user))
              
              {:status 200 :body {:message "Password reset successfully. You can now log in with your new password."}})))
        
        {:status 404 :body {:message "Invalid or expired reset token"}}))))

(defn routes [opts]
  ["/auth" {:openapi {:tags ["auth"]}
            :interceptors [(core/init-system-interceptor opts)]}
   ["/register" {:post {:summary "Register a new user"
                        :parameters {:body [:map
                                            [:email :string]
                                            [:password [:string {:min 8}]]
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
   ["/approve-user" {:get {:summary "Approve user via email link"
                          :parameters {:query [:map
                                               [:token :string]]}
                          :responses {200 {:body :any}
                                      400 {:body :any}
                                      404 {:body :any}}
                          :handler (fn [request]
                                     (approve-user-by-token request))}}]
   ["/forgot-password" {:post {:summary "Request password reset"
                                   :parameters {:body [:map
                                                       [:email :string]]}
                                   :responses {200 {:body :any}
                                               400 {:body :any}}
                                   :handler (fn [request]
                                              (forgot-password request))}}]
   ["/reset-password" {:post {:summary "Reset password with token"
                              :parameters {:body [:map
                                                  [:token :string]
                                                  [:password :string]]}
                              :responses {200 {:body :any}
                                          400 {:body :any}
                                          404 {:body :any}}
                              :handler (fn [request]
                                         (reset-password request))}}]
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



