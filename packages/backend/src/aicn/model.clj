(ns aicn.model
  (:require [malli.util :as mu]))

(def User
  [:map
   [:id :uuid]
   [:email :string]
   [:password-hash :string]
   [:name :string]
   [:organization :string]
   [:role [:enum "ADMIN" "USER"]]
   [:access-rights :map]
   [:created-at inst?]
   [:updated-at inst?]])

(def Conversation
  [:map
   [:id :uuid]
   [:table-id :uuid]
   [:item-id :string]
   [:status [:enum "OPEN" "CLOSED" "ARCHIVED"]]
   [:created-at inst?]
   [:updated-at inst?]
   [:closed-at {:optional true} [:maybe inst?]]
   [:archived-at {:optional true} [:maybe inst?]]])

(def Message
  [:map
   [:id :uuid]
   [:conversation-id :uuid]
   [:user-id :uuid]
   [:content :string]
   [:created-at inst?]])


