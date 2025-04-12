(ns aicn.utils
  (:require [jsonista.core :as json]
            [clojure.string :as str]))
            

(def mapper (json/object-mapper {:decode-key-fn (comp keyword #(str/replace % #" " "-"))
                                 :pretty true}))

(def to-json json/write-value-as-string)
(def from-json #(json/read-value % mapper))

(comment
 (def s "{\"records\":[{\"id\":\"rec0qVHWmqmE1ypm6\",\"createdTime\":\"2025-04-08T08:27:31.000Z\",\"fields\":{\"Identifiant unique du champ\":191,\"cat_ref\":[\"recP3EKhqDPFgNPbd\"],\"lib_fonc_fr\":\"Classification ICMS équipement\",\"var_type\":\"LINK\",\"desc_fr\":\"Code(s) équipement(s) dans l'arborescenece ICMS.\",\"entity\":[\"recUkSc1Y1ELAJneL\"],\"lib_group\":\"Chantier/travaux/opérations\",\"link_entity\":[\"rec3kWumrd0BSW92m\"]}},{\"id\":\"rec1GBHcky01ofmVa\",\"createdTime\":\"2025-04-06T09:39:48.000Z\",\"fields\":{\"Identifiant unique du champ\":99,\"cat_ref\":[\"recP3EKhqDPFgNPbd\"],\"lib_fonc_fr\":\"Typologie d'usage de l'espace\",\"var_type\":\"LINK\",\"entity\":[\"recjmX1dBcT00wa1d\"],\"lib_group\":\"Identification et description\",\"link_entity\":[\"recKX2qtJHABRzzbq\"]}}]}")
 (json/read-value s mapper))


