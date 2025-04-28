(ns aicn.cli
  (:require [aicn.system :as system]
            [aicn.migrations :as migrations]
            [clojure.string :as str]
            [aicn.logger :as log]
            [clojure.tools.cli :as cli])
  (:gen-class))

(def cli-options
  [["-h" "--help" "Afficher l'aide"]
   ["-p" "--profile PROFILE" "Profil de configuration (local, prod)"
    :default "local"
    :validate [#(contains? #{"local" "prod"} %) "Le profil doit être 'local' ou 'prod'"]]
   ["-m" "--migration ACTION" "Action de migration (migrate, rollback, create)"
    :validate [#(contains? #{"migrate" "rollback" "create" "rollback-all"} %) "L'action doit être 'migrate', 'rollback', 'rollback-all', ou 'create'"]]
   ["-n" "--name NAME" "Nom de la migration (requis avec --migration create)"]])

(defn usage [options-summary]
  (->> ["AICN CLI - Outil en ligne de commande"
        ""
        "Usage: aicn-cli [options]"
        ""
        "Options:"
        options-summary
        ""
        "Actions:"
        "  server        Démarrer le serveur"
        "  migrate       Exécuter les migrations en attente"
        "  rollback      Annuler la dernière migration"
        "  rollback-all  Annuler toutes les migrations"
        "  create NAME   Créer une nouvelle migration"]
       (str/join \newline)))

(defn error-msg [errors]
  (str "Les erreurs suivantes se sont produites lors de l'analyse des arguments:\n\n"
       (str/join \newline errors)))

(defn validate-args [args]
  (let [{:keys [options arguments errors summary]} (cli/parse-opts args cli-options)]
    (cond
      (:help options)
      {:exit-message (usage summary) :ok? true}
      
      errors
      {:exit-message (error-msg errors) :ok? false}
      
      (and (= "create" (:migration options))
           (empty? (:name options)))
      {:exit-message "L'option --name est requise pour créer une migration" :ok? false}
      
      :else
      {:options options :arguments arguments :summary summary})))

(defn- start-system [profile]
  (let [system-profile (if (= profile "prod") :prod :local)
        config (system/get-config system-profile)
        sys (system/-main)]
    (log/info "Système démarré avec le profil:" profile)
    sys))

(defn- handle-migration [options]
  (let [action (:migration options)
        profile (:profile options)
        system-profile (if (= profile "prod") :prod :local)
        config (system/get-config system-profile)
        migration-config (:migrations/runner config)]
    
    (try 
      (case action
        "migrate" 
        (do 
          (log/info "Exécution des migrations...")
          (migrations/run-migrations migration-config))
        
        "rollback" 
        (do 
          (log/info "Annulation de la dernière migration...")
          (migrations/rollback-migration migration-config))
        
        "rollback-all" 
        (do 
          (log/info "Annulation de toutes les migrations...")
          (migrations/rollback-all migration-config))
        
        "create" 
        (do 
          (log/info "Création d'une nouvelle migration:" (:name options))
          (migrations/create-migration migration-config (:name options))))
      
      (catch Exception e
        (log/error "Erreur lors de l'opération de migration:" (.getMessage e))
        (System/exit 1)))))

(defn -main [& args]
  (let [{:keys [options arguments exit-message ok?]} (validate-args args)]
    (if exit-message
      (do
        (println exit-message)
        (System/exit (if ok? 0 1)))
      
      (let [action (first arguments)]
        (case action
          "server" (start-system (:profile options))
          
          "migrate" (handle-migration (assoc options :migration "migrate"))
          "rollback" (handle-migration (assoc options :migration "rollback"))
          "rollback-all" (handle-migration (assoc options :migration "rollback-all"))
          "create" (handle-migration (assoc options :migration "create"
                                          :name (second arguments)))
          
          ;; Default: show usage
          (do
            (println (usage (:summary options)))
            (System/exit 1)))))))

(comment
  ;; Usage examples in REPL
  (-main "server" "-p" "local")
  (-main "migrate")
  (-main "rollback")
  (-main "create" "add-new-table")
  
  ;; Help
  (-main "--help"))