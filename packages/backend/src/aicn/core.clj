(ns aicn.core
  (:require
   [aicn.activity-logs :as activity]
   [aicn.adapters.airtable :as airtable]
   [aicn.logger :as logger]))

(defn init-system-interceptor [system]
  {:enter (fn [ctx]
            (update ctx :request merge system))})

(defn- sync-journal-tags!
  "Refresh the journal tag vocabulary (impact_post single-select options) via the
   Airtable Metadata API. Failure (e.g. a 403 from a missing schema.bases:read
   scope) is logged + surfaced as an activity log, but must NOT fail the main
   table sync. Returns :ok or :failed."
  [ctx]
  (let [auth (get-in ctx [:request :adapter/airtable])]
    (try
      (airtable/sync-impact-post-options auth)
      :ok
      (catch Exception e
        (logger/error (str "Journal tags (impact_post) sync failed: " (.getMessage e)))
        (try
          (let [user (get-in ctx [:request :session/user])]
            (activity/add-activity-log! (get-in ctx [:request :db/ds])
                                        {:type :journal-tags-sync-failed
                                         :user-email (:email user)
                                         :user-name (:name user)
                                         :user-id (:id user)
                                         :message "Journal tags (impact_post) sync failed"
                                         :details {:error (.getMessage e)}}))
          (catch Exception _ nil))
        :failed))))

(def sync-referentiels-from-airtable-interceptor
  {:enter (fn [ctx]
            (try
              (let [stats (airtable/sync-tables (get-in ctx [:request :adapter/airtable])
                                                (airtable/get-tables-names))]
                (-> ctx
                    (assoc-in [:request :aicn/sync-stats] stats)
                    (assoc-in [:request :aicn/journal-tags-sync] (sync-journal-tags! ctx))))
              (catch Exception e
                (let [error-details {:message (.getMessage e)
                                     :class (str (.getClass e))
                                     :cause (when-let [cause (.getCause e)]
                                              (.getMessage cause))
                                     :data (ex-data e)}]
                  (logger/error (str "Sync error: " (.getMessage e)
                                     (when-let [c (.getCause e)]
                                       (str " | Cause: " (.getMessage c)))))
                  (.printStackTrace e)
                  (-> ctx
                      (assoc :response {:status 500 :body {:error error-details}})
                      (assoc :queue nil))))))})

(def get-all-referentiels-interceptor
  {:enter (fn [ctx]
            (let [referentiels (airtable/get-all-referentiels)]
              (assoc-in ctx [:request :aicn/all-referentiels] referentiels)))})


(def get-all-lov-new-interceptor
  {:enter (fn [ctx]
            (let [lov-new (airtable/get-all-lov-new)]
              (assoc-in ctx [:request :aicn/all-lov-new] lov-new)))})

(def get-impact-post-options-interceptor
  {:enter (fn [ctx]
            (assoc-in ctx [:request :aicn/impact-post-options]
                      (airtable/read-impact-post-options)))})
