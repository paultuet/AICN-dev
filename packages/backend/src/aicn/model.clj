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
   [:email-verified {:optional true} [:maybe :boolean]]
   [:verification-token {:optional true} [:maybe :uuid]]
   [:verification-token-expires-at {:optional true} [:maybe inst?]]
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

(def FeatureFlag
  [:map
   [:id :int]
   [:name :string]
   [:description {:optional true} [:maybe :string]]
   [:enabled :boolean]
   [:percentage {:optional true} [:maybe :int]]
   [:created-at inst?]
   [:updated-at inst?]])

