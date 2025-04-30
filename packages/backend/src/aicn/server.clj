(ns aicn.server
  (:require [reitit.ring :as ring]
            [reitit.coercion.malli :as malli-coercion]
            [reitit.ring.malli]
            [reitit.http :as http]
            [integrant.core :as ig]
            [aicn.routes :refer [get-api-routes]]
            [reitit.swagger-ui :as swagger-ui]
            [reitit.openapi :as openapi]
            [reitit.dev.pretty :as pretty]
            [ring.middleware.reload :as reload]
            [reitit.http.coercion :as coercion]
            [reitit.interceptor.sieppari :as sieppari]
            [reitit.http.interceptors.parameters :as parameters]
            [reitit.http.interceptors.muuntaja :as muuntaja]
            [reitit.http.interceptors.exception :as exception]
            [reitit.http.interceptors.multipart :as multipart]
            [ring.middleware.resource :refer [wrap-resource]]
            [ring.middleware.content-type :refer [wrap-content-type]]
            [ring.middleware.not-modified :refer [wrap-not-modified]]
            [ring.adapter.jetty :as jetty]
            [muuntaja.core :as muuntaja-core]
            [clojure.java.io :as io]
            [malli.util :as mu]
            [clojure.string :as str]
            [aicn.auth :as auth]
            [aicn.logger :as logger]))

(defn reloading-ring-handler
  "Reload ring handler on each request."
  [f]
  (let [reload! (#'reload/reloader ["src"] true)]
    (fn
      ([request]
       (reload!)
       ((f) request))
      ([request respond raise]
       (reload!)
       ((f) request respond raise)))))

(defn wrap-cors
  "Middleware for adding CORS headers to responses"
  [handler]
  (fn [request]
    (let [response (handler request)]
      (-> response
          (assoc-in [:headers "Access-Control-Allow-Origin"] "*")
          (assoc-in [:headers "Access-Control-Allow-Methods"] "GET, POST, PUT, DELETE, OPTIONS")
          (assoc-in [:headers "Access-Control-Allow-Headers"] "Origin, Content-Type, Accept, Authorization")))))

(defn app [opts]
  (-> (http/ring-handler
       (http/router
        [["/api"
          ["/openapi.json"
           {:get {:no-doc true
                  :openapi {:info {:title "AICN ref api"
                                   :description "API des référenciels AICN"
                                   :version "0.0.1"}
                            :components {:securitySchemes
                                         {:bearerHttpAuthentication
                                          {:type "http"
                                           :scheme "bearer"
                                           :bearerFormat "JWT"
                                           :description "Bearer token using a JWT"}}}
                            :security [{:bearerHttpAuthentication []}]}
                  :handler (openapi/create-openapi-handler)}}]
          (get-api-routes opts)
          (auth/routes opts)]]
        {;;:reitit.middleware/transform dev/print-request-diffs ;; pretty diffs
         :exception pretty/exception
         :data {:coercion (malli-coercion/create
                           {:error-keys #{#_:type #_:coercion :in :schema #_:value :errors #_:humanized}
                            :compile mu/closed-schema
                            :strip-extra-keys true
                            :default-values true
                            :options nil})
                :muuntaja muuntaja-core/instance
                :interceptors [openapi/openapi-feature
                               (parameters/parameters-interceptor)
                               (muuntaja/format-negotiate-interceptor)
                               (muuntaja/format-response-interceptor)
                               (exception/exception-interceptor
                                (merge
                                 exception/default-handlers
                                 {::exception (fn [exception request]
                                                (logger/error "API Error:" (.getMessage exception)
                                                              {:exception-data (ex-data exception)
                                                               :uri (:uri request)
                                                               :request-method (:request-method request)
                                                               :params (:params request)})
                                                (throw exception))}))
                               (muuntaja/format-request-interceptor)
                               (coercion/coerce-response-interceptor)
                               (coercion/coerce-request-interceptor)
                               (multipart/multipart-interceptor)]}})
       (ring/routes
        (swagger-ui/create-swagger-ui-handler
         {:path "/api"
          :config {:validatorUrl nil
                   :urls [{:name "openapi", :url "openapi.json"}]
                   :urls.primaryName "openapi"
                   :operationsSorter "alpha"}})
        (ring/create-default-handler
         {:not-found
          (fn [r]
            (if (str/starts-with? (:uri r) "/api/")
              {:status 404
               :headers {"Content-Type" "text"}
               :body "Not found"}
              {:status 200
               :headers {"Content-Type" "text/html"}
               :body (slurp (io/resource "public/index.html"))}))}))
       {:executor sieppari/executor})

      ; (wrap-buddy-auth)
      ; (wrap-error-handling)
      wrap-cors
      (wrap-resource "public")
      wrap-content-type
      wrap-not-modified))

(defn- handler
  "Return main application handler."
  [opts]
  (app opts))

(defn run-server
  [{:keys [dev-mode? server-options opts]}]
  (let [create-handler-fn #(handler opts)
        handler* (if dev-mode?
                   (reloading-ring-handler create-handler-fn)
                   (create-handler-fn))]
    (jetty/run-jetty handler* server-options)))

(defn start [{:keys [dev-mode? port] :as opts}]
  (let [s (atom nil)]
    (logger/info "Starting server" {:port port :env-port (System/getenv "PORT") :host "0.0.0.0"})
    ;; Utilisation explicite de l'adresse 0.0.0.0 et configuration des connecteurs
    (System/setProperty "jetty.host" "0.0.0.0")
    (reset! s (run-server {:dev-mode? dev-mode?
                           :opts opts
                           :server-options {:join? false
                                            :port port
                                            :host "0.0.0.0"
                                            :configurator (fn [server]
                                                            (let [connectors (.getConnectors server)]
                                                              (doseq [connector connectors]
                                                                (.setHost connector "0.0.0.0"))))}}))
    (logger/info "Server started" {:port port :host "0.0.0.0"})
    @s))

(defmethod ig/init-key :http/server [_ opts]
  (start opts))

(defmethod ig/halt-key! :http/server [_ server]
  (.stop server))

