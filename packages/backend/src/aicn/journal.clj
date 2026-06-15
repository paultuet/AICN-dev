(ns aicn.journal
  "HTTP handlers for the Journal feature: admin-authored posts (rich text + tag +
   optional attachments) that all authenticated users can read and filter."
  (:require
   [aicn.activity-logs :as activity]
   [aicn.adapters.airtable :as airtable]
   [aicn.db :as db]
   [aicn.files :as files]
   [aicn.html :as html]
   [aicn.logger :as log]
   [clojure.java.io :as io]
   [clojure.string :as str]
   [ring.util.response :as response])
  (:import [java.util UUID]))

;; ---------------------------------------------------------------------------
;; Helpers
;; ---------------------------------------------------------------------------

(defn- parse-int [s default]
  (if (and s (re-matches #"\d+" (str s)))
    (Integer/parseInt (str s))
    default))

(defn- attachment->wire [a]
  {:id (str (:id a))
   :postId (str (:post_id a))
   :fileName (:file_name a)
   :fileSize (:file_size a)
   :contentType (:content_type a)
   :createdAt (:created_at a)})

(defn- post->wire [post attachments]
  {:id (str (:id post))
   :postDate (:post_date post)
   :title (:title post)
   :content (:content post)
   :tag (:tag post)
   :createdBy (str (:created_by post))
   :createdAt (:created_at post)
   :updatedAt (:updated_at post)
   :attachments (mapv attachment->wire attachments)})

(defn- known-tag?
  "Lenient validation: when the tag vocabulary is unknown (not yet synced from
   Airtable → empty list), accept any non-blank tag rather than blocking posts."
  [options tag]
  (or (empty? options)
      (some #(= % tag) options)))

;; ---------------------------------------------------------------------------
;; Posts
;; ---------------------------------------------------------------------------

(defn get-posts-handler [request]
  (let [ds (:db/ds request)
        limit (min 100 (parse-int (get-in request [:query-params "limit"]) 20))
        offset (parse-int (get-in request [:query-params "offset"]) 0)
        posts (db/get-posts ds {:limit limit :offset offset})
        attachments (db/get-attachments-for-posts ds (mapv :id posts))
        by-post (group-by :post_id attachments)]
    (response/response
     {:posts (mapv (fn [p] (post->wire p (get by-post (:id p) []))) posts)})))

(defn get-post-handler [request]
  (let [ds (:db/ds request)
        post-id (get-in request [:path-params :post-id])]
    (if-let [post (db/get-post-by-id ds post-id)]
      (response/response (post->wire post (db/get-attachments-for-posts ds [(:id post)])))
      (response/not-found {:error "Post introuvable"}))))

(defn create-post-handler [request]
  (let [ds (:db/ds request)
        user (:session/user request)
        {:keys [postDate title content tag]} (:body-params request)
        options (airtable/read-impact-post-options)]
    (cond
      (or (str/blank? postDate) (str/blank? title) (str/blank? content) (str/blank? tag))
      (response/bad-request {:error "postDate, title, content et tag sont obligatoires"})

      (not (known-tag? options tag))
      (response/bad-request {:error (str "Tag inconnu: " tag)})

      :else
      (let [post (db/create-post ds {:post-date postDate
                                     :title title
                                     :content (html/sanitize content)
                                     :tag tag
                                     :created-by (:id user)})]
        (activity/add-activity-log! ds {:type :journal-post-created
                                        :user-email (:email user)
                                        :user-name (:name user)
                                        :user-id (:id user)
                                        :message "Journal post created"
                                        :details {:post-id (str (:id post))
                                                  :title title
                                                  :tag tag}})
        (response/response (post->wire post []))))))

(defn update-post-handler [request]
  (let [ds (:db/ds request)
        user (:session/user request)
        post-id (get-in request [:path-params :post-id])
        {:keys [postDate title content tag]} (:body-params request)
        options (airtable/read-impact-post-options)]
    (if (and (not (str/blank? tag)) (not (known-tag? options tag)))
      (response/bad-request {:error (str "Tag inconnu: " tag)})
      (let [updated (db/update-post ds {:id post-id
                                        :post-date (when-not (str/blank? postDate) postDate)
                                        :title (when-not (str/blank? title) title)
                                        :content (when-not (str/blank? content) (html/sanitize content))
                                        :tag (when-not (str/blank? tag) tag)})]
        (if updated
          (do
            (activity/add-activity-log! ds {:type :journal-post-updated
                                            :user-email (:email user)
                                            :user-name (:name user)
                                            :user-id (:id user)
                                            :message "Journal post updated"
                                            :details {:post-id (str (:id updated))
                                                      :title (:title updated)}})
            (response/response (post->wire updated (db/get-attachments-for-posts ds [(:id updated)]))))
          (response/not-found {:error "Post introuvable"}))))))

(defn delete-post-handler [request]
  (let [ds (:db/ds request)
        user (:session/user request)
        post-id (get-in request [:path-params :post-id])]
    (if-let [post (db/get-post-by-id ds post-id)]
      (do
        ;; Unlink files BEFORE the ON DELETE CASCADE removes the attachment rows,
        ;; otherwise we lose the file paths and leave orphans on disk.
        (doseq [a (db/get-attachments-for-posts ds [(:id post)])]
          (try
            (io/delete-file (:file_path a) true)
            (catch Exception e
              (log/error (str "Error deleting journal attachment file: " (.getMessage e))))))
        (db/delete-post ds post-id)
        (activity/add-activity-log! ds {:type :journal-post-deleted
                                        :user-email (:email user)
                                        :user-name (:name user)
                                        :user-id (:id user)
                                        :message "Journal post deleted"
                                        :details {:post-id (str (:id post))
                                                  :title (:title post)}})
        (response/response {:success true}))
      (response/not-found {:error "Post introuvable"}))))

;; ---------------------------------------------------------------------------
;; Attachments
;; ---------------------------------------------------------------------------

(defn upload-attachments-handler [request]
  (try
    (let [ds (:db/ds request)
          user (:session/user request)
          post-id (get-in request [:path-params :post-id])
          multipart (:multipart (:parameters request))
          files (:files multipart)
          files-vec (cond (nil? files) [] (vector? files) files :else [files])]
      (if-not (db/get-post-by-id ds post-id)
        (response/not-found {:error "Post introuvable"})
        (let [saved (mapv (fn [file]
                            (let [file-id (str (UUID/randomUUID))
                                  file-path (files/save-file-to "journal" file file-id)
                                  file-size (.length (io/file (:tempfile file)))
                                  rec (db/create-journal-attachment
                                       ds {:post-id post-id
                                           :file-name (:filename file)
                                           :file-path file-path
                                           :file-size file-size
                                           :content-type (:content-type file)})]
                              (activity/add-activity-log! ds {:type :journal-attachment-added
                                                              :user-email (:email user)
                                                              :user-name (:name user)
                                                              :user-id (:id user)
                                                              :message "Journal attachment added"
                                                              :details {:post-id post-id
                                                                        :file-name (:filename file)}})
                              (attachment->wire rec)))
                          files-vec)]
          (response/response {:attachments saved}))))
    (catch Exception e
      (log/error (str "Error uploading journal attachments: " (.getMessage e)) e)
      (response/status (response/response {:error "Internal server error"}) 500))))

(defn download-attachment-handler [request]
  (let [ds (:db/ds request)
        attachment-id (get-in request [:path-params :attachment-id])]
    (if-let [a (db/get-attachment-by-id ds attachment-id)]
      (let [file-obj (io/file (:file_path a))]
        (if (.exists file-obj)
          (-> (response/file-response (:file_path a))
              (response/header "Content-Disposition"
                               (str "attachment; filename=\"" (:file_name a) "\""))
              (response/header "Content-Type" (or (:content_type a) "application/octet-stream")))
          (response/not-found {:error "Fichier introuvable sur le disque"})))
      (response/not-found {:error "Pièce jointe introuvable"}))))

(defn delete-attachment-handler [request]
  (let [ds (:db/ds request)
        user (:session/user request)
        attachment-id (get-in request [:path-params :attachment-id])
        deleted (db/delete-attachment ds attachment-id)]
    (if deleted
      (do
        (try
          (io/delete-file (:file_path deleted) true)
          (catch Exception e
            (log/error (str "Error deleting journal attachment file: " (.getMessage e)))))
        (activity/add-activity-log! ds {:type :journal-attachment-deleted
                                        :user-email (:email user)
                                        :user-name (:name user)
                                        :user-id (:id user)
                                        :message "Journal attachment deleted"
                                        :details {:attachment-id attachment-id}})
        (response/response {:success true}))
      (response/not-found {:error "Pièce jointe introuvable"}))))
