(ns aicn.auth
  (:require
   [buddy.hashers :as hashers]
   [buddy.sign.jwt :as jwt]
   [clojure.string :as str]
   [java-time.api :as time]
   [re-frame.core :as rf]
   [aicn.core :as core]
   [aicn.db :as repo]))

(def secret "votre-clé-secrète-très-longue")

(defn hash-password [password]
  (hashers/derive password {:alg :bcrypt+blake2b-512
                            :iterations 12}))

(defn valid-password? [plain-password hashed-password]
  (let [{:keys [valid]} (hashers/verify plain-password hashed-password)]
    valid))

(defn create-user-with-password
  "Helper function to create a user with a plain text password that gets hashed"
  [datasource {:keys [email password name organization role]
               :or {role "USER"}}]
  (try
    (let [password-hash (hash-password password)
          access-rights {:referenceIds [] :categoryIds []}
          user-data {:email (str/lower-case email)
                     :password-hash password-hash
                     :name name
                     :organization organization
                     :role role
                     :access-rights access-rights}]
      (repo/create-user datasource user-data))
    (catch Exception e
      (throw (ex-info "Failed to create user"
                      {:cause (.getMessage e)
                       :data {:email email :name name :organization organization}}
                      e)))))

(defn login
  [{:keys [db/ds parameters]}]
  (if (nil? parameters)
    {:status 400 :body {:message "No parameters received"}}

    (let [params  (:body parameters)
          {:keys [email password]} params]

      (if (or (nil? email) (nil? password))
        {:status 400 :body {:message "Missing email or password"}}

        (if-let [user (repo/get-user-by-email ds (str/lower-case email))]
          (if (valid-password? password (:password-hash user))
            (let [claims {:email (:email user)
                          :id (:id user)
                          :exp (time/plus (time/instant) (time/seconds 3600))}
                  token (jwt/sign claims secret {:alg :hs512})]
              {:status 200
               :body {:token token}})
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

(def authorization-interceptor
  {:name ::authorization
   :enter (fn [context]
            (if (get-in context [:request :session/user])
              context
              (-> context
                  (assoc :response {:status 401 :body {:error "Non autorisé"}})
                  (assoc :queue nil))))})

(defn register
  [{:keys [db/ds parameters]}]
  (if (nil? parameters)
    {:status 400 :body {:message "No parameters received"}}

    ;; Try to get params from either form or body
    (let [params (or (:form parameters)
                     (:body parameters)
                     {})
          {:keys [email password name organization]} params]

      (if (or (nil? email) (nil? password) (nil? name) (nil? organization))
        {:status 400 :body {:message "Missing required fields"}}

        (if (repo/get-user-by-email ds (str/lower-case email))
          ;; User already exists with this email
          {:status 400
           :body {:message "Email already in use"}}

          ;; Create new user
          (try
            (println "Attempting to create user...")
            (let [user-data {:email email
                             :password password
                             :name name
                             :organization organization}
                  user (create-user-with-password ds user-data)
                  claims {:email (:email user)
                          :id (:id user)
                          :exp (time/plus (time/instant) (time/seconds 3600))}
                  token (jwt/sign claims secret {:alg :hs512})
                  result {:status 201
                          :body {:token token
                                 :user (select-keys user [:id :email :name :organization :role])}}]
              result)
            (catch Exception e
              ;; Formatez l'erreur pour inclure autant d'informations que possible
              (let [error-details {:message (.getMessage e)
                                   :class (str (.getClass e))
                                   :cause (when-let [cause (.getCause e)]
                                            (.getMessage cause))}]
                {:status 500
                 :body {:error "Failed to register user"
                        :details error-details}}))))))))

(defn routes [opts]
  ["/auth" {:openapi {:tags ["auth"]}
            :interceptors [(core/init-system-interceptor opts)]
            :options {:summary "Handle CORS preflight"
                      :handler (fn [_]
                                 {:status 200
                                  :body ""})}}

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




