(ns aicn.files
  (:require
   [aicn.db :as db]
   [aicn.logger :as log]
   [aicn.activity-logs :as activity]
   [clojure.java.io :as io]
   [java-time.api :as time]
   [ring.util.response :as response])
  (:import [java.util UUID]))

(def upload-dir "uploads")

(defn ensure-upload-dir []
  (let [dir (io/file upload-dir)]
    (when-not (.exists dir)
      (.mkdirs dir))))

(defn save-file [file file-id]
  (ensure-upload-dir)
  (let [file-path (str upload-dir "/" file-id "_" (:filename file))
        dest-file (io/file file-path)]
    (io/copy (:tempfile file) dest-file)
    file-path))

(defn upload-file-handler [request]
  (try
    (let [ds (:db/ds request)
          user (:session/user request)
          ;; Get multipart data from parameters - it's in (:multipart (:parameters request))
          multipart-data (:multipart (:parameters request))

          ;; Extract fields - they are keywords based on the logs
          files (:files multipart-data)
          titles (:titles multipart-data)
          version (:version multipart-data)
          upload-date (:uploadDate multipart-data)]

      ;; Validate inputs
      (when (or (nil? files) (nil? version) (nil? upload-date))
        (throw (ex-info "Missing required fields" {:status 400})))

      ;; Ensure files and titles are vectors
      (let [files-vec (if (vector? files) files [files])
            titles-vec (if (vector? titles) titles [titles])
            user-id (:id user)
            user-email (:email user)]

        ;; Upload all files
        (let [uploaded-files
              (mapv (fn [file title]
                      (let [file-id (str (UUID/randomUUID))
                            file-path (save-file file file-id)
                            file-size (.length (io/file (:tempfile file)))
                            file-record (db/create-file ds {:id (UUID/fromString file-id)
                                                            :file-name (:filename file)
                                                            :file-path file-path
                                                            :version version
                                                            :upload-date (java.time.LocalDate/parse upload-date)
                                                            :file-size file-size
                                                            :content-type (:content-type file)
                                                            :uploaded-by user-id
                                                            :title title})]

                        (log/info (str "File uploaded - User: " user-email
                                      " - File ID: " file-id
                                      " - File name: " (:filename file)
                                      " - Title: " title
                                      " - Version: " version
                                      " - Time: " (time/instant)))

                        (activity/add-activity-log! ds {:type :file-uploaded
                                                        :user-email user-email
                                                        :user-name (:name user)
                                                        :user-id user-id
                                                        :message "File uploaded"
                                                        :details {:file-id file-id
                                                                :file-name (:filename file)
                                                                :title title
                                                                :version version
                                                                :size file-size}})

                        {:id file-id
                         :fileName (:file_name file-record)
                         :title (:title file-record)
                         :version (:version file-record)
                         :uploadDate (:upload_date file-record)
                         :fileSize (:file_size file-record)}))
                    files-vec
                    titles-vec)]

          (response/response {:files uploaded-files}))))
    (catch Exception e
      (log/error (str "Error in file upload: " (.getMessage e)) e)
      (if (:status (ex-data e))
        (response/bad-request {:error (.getMessage e)})
        (response/status (response/response {:error "Internal server error"}) 500)))))

(defn get-current-file-handler [request]
  (let [datasource (get-in request [:db/ds])]
    (if-let [file (db/get-current-file datasource)]
      (response/response {:id (str (:id file))
                         :fileName (:file_name file)
                         :title (:title file)
                         :version (:version file)
                         :uploadDate (:upload_date file)
                         :fileSize (:file_size file)})
      (response/not-found {:error "No file available"}))))

(defn get-all-files-handler [request]
  (let [datasource (get-in request [:db/ds])
        files (db/get-all-files datasource)]
    (response/response {:files (mapv (fn [file]
                                       {:id (str (:id file))
                                        :fileName (:file_name file)
                                        :title (:title file)
                                        :version (:version file)
                                        :uploadDate (:upload_date file)
                                        :fileSize (:file_size file)})
                                     files)})))

(defn download-file-handler [request]
  (let [datasource (get-in request [:db/ds])
        file-id (get-in request [:path-params :file-id])]
    (if-let [file (db/get-file-by-id datasource (UUID/fromString file-id))]
      (let [file-obj (io/file (:file_path file))]
        (if (.exists file-obj)
          (-> (response/file-response (:file_path file))
              (response/header "Content-Disposition"
                             (str "attachment; filename=\"" (:file_name file) "\""))
              (response/header "Content-Type" (or (:content_type file) "application/octet-stream")))
          (response/not-found {:error "File not found on disk"})))
      (response/not-found {:error "File not found in database"}))))

(defn delete-file-handler [request]
  (try
    (let [datasource (get-in request [:db/ds])
          user (:session/user request)
          file-id (get-in request [:path-params :file-id])]

      (if-let [file (db/get-file-by-id datasource (UUID/fromString file-id))]
        (do
          ;; Delete file from disk
          (try
            (io/delete-file (:file_path file) true)
            (log/info (str "File deleted from disk: " (:file_path file)))
            (catch Exception e
              (log/error (str "Error deleting file from disk: " (.getMessage e)))))

          ;; Delete from database
          (db/delete-file datasource (UUID/fromString file-id))

          (log/info (str "File deleted - User: " (:email user)
                        " - File ID: " file-id
                        " - File name: " (:file_name file)))

          (activity/add-activity-log! datasource {:type :file-deleted
                                                    :user-email (:email user)
                                                    :user-name (:name user)
                                                    :user-id (:id user)
                                                    :message "File deleted"
                                                    :details {:file-id file-id
                                                            :file-name (:file_name file)
                                                            :title (:title file)}})

          (response/response {:success true
                              :message "File deleted successfully"}))
        (response/not-found {:error "File not found"})))
    (catch Exception e
      (log/error (str "Error in file deletion: " (.getMessage e)) e)
      (response/status (response/response {:error "Internal server error"}) 500))))