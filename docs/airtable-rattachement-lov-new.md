# Rattachement des entrées `lov_new` aux tables de référence — Instructions pour Yves

## Contexte

Bonjour Yves,

Ce document décrit la procédure à suivre dans Airtable pour que les valeurs des listes de valeurs (LoV) s'affichent correctement dans l'application AICN, notamment dans les popups accessibles depuis l'écran « Inventaire d'espaces » et les autres écrans utilisant des références `lov_*`.

La table `lov_new` venant d'être **supprimée puis restaurée**, son contenu actuel peut différer de l'état précédent. Avant toute modification, suivez impérativement l'**Étape 0** de vérification ci-dessous.

Le principe : ajouter une colonne `lov_table` à la table `lov_new`, puis indiquer pour chaque entrée à quelle table de référence elle appartient. C'est cette colonne qui permet à l'application de retrouver les bonnes valeurs.

> **Important — correspondance exacte.** L'application compare le contenu de `lov_table` **caractère pour caractère** avec le nom de la table de référence. La moindre différence (espace en trop, majuscule, accent, faute de frappe) fait que la popup affiche « Aucune valeur disponible » sans autre message d'erreur. Respectez donc l'orthographe **à l'identique** de ce document. En cas de doute, ne modifiez rien et contactez l'équipe technique AICN.

---

## Étape 0 — Vérifier l'état de la table restaurée

Avant d'éditer quoi que ce soit, vérifiez que la restauration est complète.

1. Ouvrir la base Airtable du projet AICN.
2. Dans la barre latérale gauche, confirmer la présence d'une table nommée **exactement** `lov_new`.
3. Vérifier que les colonnes suivantes existent, avec ces noms exacts (sans renommage) : `id_code`, `Value`, `complement_value`, `NumeroAuto`.
4. Compter les lignes : la table doit contenir **79 lignes** — soit **76 entrées avec un code** + **3 lignes « source Omniclass »** (voir Étape 3).
5. Vérifier que la colonne `lov_table` **n'existe pas encore**. Si elle existe déjà (la restauration a pu la ramener), ne pas en recréer une — passer directement à l'Étape 2 après avoir vérifié que son type est bien « Single line text ».

**Liste des 76 codes attendus** (pour repérer une éventuelle ligne manquante) :

- `cofrac_1.1.1`, `cofrac_1.1.2`, `cofrac_2.2.1`, `cofrac_2.2.2`, `cofrac_2.2.3`, `cofrac_2.2.4`, `cofrac_6.2.1`, `cofrac_11.3.1`, `cofrac_12.4.1`, `cofrac_14.9.1`, `cofrac_14.9.2`, `cofrac_15.4.1`, `cofrac_15.4.2` (13)
- `ESRS_E1`, `ESRS_E2`, `ESRS_E3`, `ESRS_E4`, `ESRS_E5`, `ESRS_S1`, `ESRS_S2`, `ESRS_S3`, `ESRS_S4` (9)
- `etat_visuel_1`, `etat_visuel_2`, `etat_visuel_3`, `etata_visuel_4` (4)
- `XP_CEN_TS_17385_1`, `XP_CEN_TS_17385_2`, `XP_CEN_TS_17385_3`, `XP_CEN_TS_17385_4`, `XP_CEN_TS_17385_5`, `XP_CEN_TS_17385_6` (6)
- `objet_chantier_10`, `objet_chantier_11`, `objet_chantier_20`, `objet_chantier_21`, `objet_chantier_30`, `objet_chantier_31`, `objet_chantier_32`, `objet_chantier_40`, `objet_chantier_41`, `objet_chantier_42` (10)
- `motif_maint_1`, `motif_maint_2`, `motif_maint_3` (3)
- `priorité_ppat_1`, `priorité_ppat_2`, `priorité_ppat_3` (3)
- `statut_suivi_chantier_1`, `statut_suivi_chantier_2`, `statut_suivi_chantier_3` (3)
- `statut_valid_ppat_1`, `statut_valid_ppat_2`, `statut_valid_ppat_3` (3)
- `imputation_1`, `imputation_2` (2)
- `SURF_PLANCHER`, `SURF_HABITABLE`, `SURF_TOTALE`, `SURF_BOUTIN`, `SURF_CARREZ`, `SURF_UTILE`, `SURF_DPE`, `SURF_FISCALE`, `SURF_ANNEXE`, `SUB`, `SUN`, `SHOB`, `SHON`, `SHOP`, `SDEP`, `EMPRISE_SOL`, `CES`, `COS`, `GLA`, `TANTIEME` (20)

**Si le compte de lignes ou les colonnes ne correspondent pas : arrêtez-vous et signalez-le à l'équipe AICN avant de continuer.** Remplir `lov_table` sur une table incomplète, puis lancer la synchronisation (Étape 5), remplacerait les données de l'application par cet état incomplet.

> Remarque : le code `etata_visuel_4` comporte une coquille (« etat**a** ») présente dans la donnée d'origine. C'est volontaire de la conserver telle quelle — **ne pas la corriger**, sinon la correspondance échouera.

---

## Étape 1 — Ajouter la colonne `lov_table`

*(À ignorer si la colonne `lov_table` existe déjà, cf. Étape 0.)*

1. Sélectionner la table `lov_new`.
2. Faire défiler horizontalement jusqu'à la dernière colonne (le bouton peut être un **+** à l'extrême droite de la grille).
3. Cliquer sur le bouton **+** pour ajouter un champ.
4. Saisir le nom **exactement** ainsi (minuscules, underscore, sans espace) :

   ```
   lov_table
   ```

5. Choisir le type **Single line text** (texte d'une ligne).
6. Valider (bouton **Create field** / **Créer le champ** — le libellé peut s'afficher en anglais ou en français selon votre interface).

La colonne `lov_table` apparaît, vide pour toutes les lignes.

---

## Étape 2 — Renseigner `lov_table` (correspondances sans ambiguïté)

Pour chaque ligne, repérer son `id_code` dans le tableau ci-dessous et saisir la valeur correspondante dans `lov_table`. **Aucun espace avant ou après**, orthographe à l'identique.

| `id_code`               | Valeur à saisir dans `lov_table` |
|-------------------------|----------------------------------|
| etat_visuel_1           | lov_etat_visuel_eqpmt            |
| etat_visuel_2           | lov_etat_visuel_eqpmt            |
| etat_visuel_3           | lov_etat_visuel_eqpmt            |
| etata_visuel_4          | lov_etat_visuel_eqpmt            |
| ESRS_E1                 | lov_esrs                         |
| ESRS_E2                 | lov_esrs                         |
| ESRS_E3                 | lov_esrs                         |
| ESRS_E4                 | lov_esrs                         |
| ESRS_E5                 | lov_esrs                         |
| ESRS_S1                 | lov_esrs                         |
| ESRS_S2                 | lov_esrs                         |
| ESRS_S3                 | lov_esrs                         |
| ESRS_S4                 | lov_esrs                         |
| objet_chantier_10       | lov_objet_chantier               |
| objet_chantier_11       | lov_objet_chantier               |
| objet_chantier_20       | lov_objet_chantier               |
| objet_chantier_21       | lov_objet_chantier               |
| objet_chantier_30       | lov_objet_chantier               |
| objet_chantier_31       | lov_objet_chantier               |
| objet_chantier_32       | lov_objet_chantier               |
| objet_chantier_40       | lov_objet_chantier               |
| objet_chantier_41       | lov_objet_chantier               |
| objet_chantier_42       | lov_objet_chantier               |
| motif_maint_1           | lov_motifs_maintenance           |
| motif_maint_2           | lov_motifs_maintenance           |
| motif_maint_3           | lov_motifs_maintenance           |
| priorité_ppat_1         | lov_priorite_ppat                |
| priorité_ppat_2         | lov_priorite_ppat                |
| priorité_ppat_3         | lov_priorite_ppat                |
| statut_suivi_chantier_1 | lov_statut_chantier              |
| statut_suivi_chantier_2 | lov_statut_chantier              |
| statut_suivi_chantier_3 | lov_statut_chantier              |
| statut_valid_ppat_1     | lov_statut_validation_ppat       |
| statut_valid_ppat_2     | lov_statut_validation_ppat       |
| statut_valid_ppat_3     | lov_statut_validation_ppat       |
| imputation_1            | lov_type_imputation              |
| imputation_2            | lov_type_imputation              |
| SURF_PLANCHER           | lov_types_mesures_surfaces       |
| SURF_HABITABLE          | lov_types_mesures_surfaces       |
| SURF_TOTALE             | lov_types_mesures_surfaces       |
| SURF_BOUTIN             | lov_types_mesures_surfaces       |
| SURF_CARREZ             | lov_types_mesures_surfaces       |
| SURF_UTILE              | lov_types_mesures_surfaces       |
| SURF_DPE                | lov_types_mesures_surfaces       |
| SURF_FISCALE            | lov_types_mesures_surfaces       |
| SURF_ANNEXE             | lov_types_mesures_surfaces       |
| SUB                     | lov_types_mesures_surfaces       |
| SUN                     | lov_types_mesures_surfaces       |
| SHOB                    | lov_types_mesures_surfaces       |
| SHON                    | lov_types_mesures_surfaces       |
| SHOP                    | lov_types_mesures_surfaces       |
| SDEP                    | lov_types_mesures_surfaces       |
| EMPRISE_SOL             | lov_types_mesures_surfaces       |
| CES                     | lov_types_mesures_surfaces       |
| COS                     | lov_types_mesures_surfaces       |
| GLA                     | lov_types_mesures_surfaces       |
| TANTIEME                | lov_types_mesures_surfaces       |
| cofrac_1.1.1            | lov_domaine_tech_controle        |
| cofrac_1.1.2            | lov_domaine_tech_controle        |
| cofrac_2.2.1            | lov_domaine_tech_controle        |
| cofrac_2.2.2            | lov_domaine_tech_controle        |
| cofrac_2.2.3            | lov_domaine_tech_controle        |
| cofrac_2.2.4            | lov_domaine_tech_controle        |
| cofrac_6.2.1            | lov_domaine_tech_controle        |
| cofrac_11.3.1           | lov_domaine_tech_controle        |
| cofrac_12.4.1           | lov_domaine_tech_controle        |
| cofrac_14.9.1           | lov_domaine_tech_controle        |
| cofrac_14.9.2           | lov_domaine_tech_controle        |
| cofrac_15.4.1           | lov_domaine_tech_controle        |
| cofrac_15.4.2           | lov_domaine_tech_controle        |

Soit **70 lignes** à renseigner ici. Les 9 lignes restantes (6 × `XP_CEN_TS_17385_*` et 3 × source Omniclass) sont traitées à l'**Étape 3**.

### Astuce pour aller plus vite

1. Trier la table par `id_code` (flèche à droite de l'en-tête `id_code` → « Sort A → Z »).
2. Sélectionner les cellules `lov_table` consécutives partageant la même valeur (ex. toutes les lignes `cofrac_*`).
3. Saisir la valeur une fois, puis copier-coller sur la sélection (Cmd/Ctrl+C puis Cmd/Ctrl+V).

> Attention : après tri, vérifiez bien que la sélection ne déborde pas sur une ligne qui devrait recevoir une autre valeur (les lignes `XP_CEN_TS_*` et les lignes Omniclass ne doivent **pas** être incluses dans le collage groupé).

---

## Étape 3 — Cas à arbitrer (ne rien deviner)

Deux groupes de lignes nécessitent une décision de l'équipe AICN. **Laissez `lov_table` vide pour ces lignes** tant que la décision n'est pas prise — ne pas remplir au hasard.

**1. Les 6 lignes `XP_CEN_TS_17385_1` à `XP_CEN_TS_17385_6`**
Ce sont les niveaux d'une échelle d'état selon la norme XP CEN/TS 17385 (« Excellent état », « Bon état », …). Les lignes `etat_visuel_1` à `etata_visuel_4` constituent une **autre** échelle d'état (4 niveaux). On ne sait pas encore si les deux échelles doivent alimenter la même liste `lov_etat_visuel_eqpmt`, ou si `XP_CEN_TS_*` doit aller dans une liste dédiée. → **En attente de décision équipe AICN.**

**2. Les 3 lignes dont `id_code` = `https://theconstructionstandard.com/`**
Ces 3 lignes sont **rigoureusement identiques** (même `id_code`, même `Value` : « Source de référence et conditions d'accès à Omniclass »). Ce ne sont pas des valeurs de classification mais des **liens de référence**. Rien ne permet de les répartir entre `lov_omniclass_table_13`, `_14` ou `table23`. → **Laisser `lov_table` vide et signaler à l'équipe AICN.**

---

## Étape 4 — Listes de valeurs à créer (contenu à fournir par l'équipe AICN)

Cinq tables de référence sont utilisées par l'application mais n'ont **aucune entrée** dans `lov_new`. Leurs popups resteront vides tant qu'on n'aura pas créé les valeurs correspondantes :

- `lov_etat_fonct_eqpmt` — états de fonctionnement des équipements
- `lov_omniclass_table_13` — classification Omniclass table 13
- `lov_omniclass_table_14` — classification Omniclass table 14
- `lov_omniclass_table23` — classification Omniclass table 23
- `lov_types_zone_regroupement_physique` — types de zones / regroupements d'espaces

> **Orthographe à respecter impérativement :** `lov_omniclass_table_13` et `lov_omniclass_table_14` ont un underscore avant le numéro, **mais `lov_omniclass_table23` n'en a pas**. Ce n'est pas une faute : c'est la forme attendue par l'application. **Ne pas l'uniformiser en `lov_omniclass_table_23`**, sinon la correspondance échouera.

Le contenu réel de ces listes (codes Omniclass, libellés des états de fonctionnement, types de zones) relève du métier et **doit être fourni par l'équipe AICN** — merci de ne pas l'inventer. Une fois les valeurs transmises, créer une ligne par valeur en renseignant :

| Colonne            | Contenu                                                              |
|--------------------|----------------------------------------------------------------------|
| `id_code`          | Identifiant technique unique fourni par l'équipe (ex. `etat_fonct_1`)|
| `Value`            | Libellé affiché à l'utilisateur (ex. « En service »)                 |
| `complement_value` | Description complémentaire (facultatif)                              |
| `lov_table`        | Nom exact de la table de référence (ex. `lov_etat_fonct_eqpmt`)      |

---

## Étape 5 — Lancer la synchronisation

> **À ne faire qu'une fois** : (a) la table vérifiée complète (Étape 0) **et** (b) toutes les valeurs `lov_table` renseignées. La synchronisation **remplace intégralement** les données en cache de l'application : une table incomplète au moment de la synchro produira des listes incomplètes dans l'application.

La synchronisation se déclenche depuis l'application AICN, et **non** depuis Airtable. Elle nécessite un **compte AICN avec le rôle Administrateur** (le rôle d'administrateur Airtable ne suffit pas — sans compte AICN admin, le bouton n'apparaît pas). Si vous ne disposez pas de cet accès, transmettez la demande à l'équipe AICN qui lancera la synchronisation.

1. Se connecter à l'application AICN avec un compte **Administrateur**.
2. Cliquer sur **Admin** dans la barre de navigation.
3. Cliquer sur l'onglet **Airtable** (ce n'est pas l'onglet affiché par défaut ; remarque : cet onglet ne se met pas visuellement en surbrillance, c'est un défaut d'affichage connu et sans conséquence).
4. Cliquer sur le bouton rouge **Synchroniser avec Airtable**.
5. Confirmer la fenêtre **« Voulez-vous synchroniser les données depuis Airtable ? »**.
6. Attendre le message **« Synchronisation terminée »**.

---

## Vérification

Après la synchronisation :

1. Ouvrir l'application AICN et **recharger la page en forçant le cache** (Cmd/Ctrl + Shift + R). Ce rechargement est nécessaire : les listes de valeurs ne se rafraîchissent pas automatiquement juste après la synchro.
2. Aller dans **Inventaire d'espaces**.
3. Repérer le champ référençant `lov_types_mesures_surfaces.id_type_mesure_surface`, cliquer sur le lien `lov_types_mesures_surfaces` dans la colonne « Clé étrangère ».
4. La popup « Valeurs LOV — lov_types_mesures_surfaces » doit afficher les **20 mesures de surfaces** (surface de plancher, surface habitable, etc.).
5. Vérifier aussi une liste d'une autre catégorie (ex. `lov_objet_chantier` → 10 valeurs) pour confirmer.

Si une popup affiche « Aucune valeur disponible dans lov_new », vérifier dans l'ordre :

- La colonne s'appelle **exactement** `lov_table` (minuscules, underscore, sans espace).
- La valeur saisie correspond **exactement** au nom de la table (ni espace en trop, ni majuscule, ni accent erroné) — ex. `lov_types_mesures_surfaces`.
- Les lignes attendues sont bien présentes (Étape 0) — une ligne manquante après restauration donne une liste incomplète.
- La synchronisation a bien été lancée **après** vos modifications, et la page a été rechargée en forçant le cache.
- Le lien n'apparaît que pour les champs dont la clé étrangère commence par `lov` ; sur un autre champ, c'est normal qu'il n'y ait pas de popup.

En cas d'écart non expliqué par ces points, **arrêtez-vous et contactez l'équipe technique AICN** plutôt que de modifier la donnée à l'aveugle.
