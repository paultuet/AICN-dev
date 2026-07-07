# Dashboards Adoption

Deux vues sous l'onglet **Adoption** (bascule « Suivi par statut » / « Programmes »), reconstruites à partir des prototypes HTML autonomes (`spec_dashboards_airtable.md`) et intégrées dans l'app AICN.

## Différence clé avec les prototypes
Les prototypes tapaient Airtable **depuis le navigateur** avec un PAT collé à la main. Ici, **le token reste côté serveur** : le frontend n'appelle que le backend (`/api/adoption/*`), qui interroge Airtable en **live** (pas via le cache JSON de `/sync` — les URLs de logos Airtable expirent en quelques heures).

## Base & tables Airtable
- **Base** : `appahFa9d2SoAtcYQ` (= `AIRTABLE_APP_ID`, la base principale AICN).
- **Tables** (référencées par ID, robustes aux renommages) :
  - `dash_adopt` — `tblI5jo1D4Nw6WCHs` (suivi : société × programme × statut, logo, type métier/tech)
  - `pgm_adopt` — `tblqTOtjFebcdC6E0` (programmes : Name, Description du programme, Cible, Livrables, Communication)
  - `agenda` — `tblwWw09d9AhtiE0q` (événements : num_event, titre_event, Date, pgm_adopt)

## Token Airtable — scopes & config
- Scope requis : **`data.records:read`** sur les 3 tables ci-dessus. (Aucune écriture Airtable : les inscriptions vont en base Postgres.)
- Génération : Airtable → *Developer hub → Personal access tokens* → créer un PAT avec `data.records:read`, accès à la base `appahFa9d2SoAtcYQ`.
- Config backend :
  - Par défaut, réutilise `AIRTABLE_TOKEN` / `AIRTABLE_APP_ID`.
  - Override optionnel si la base « adoption » diffère : `ADOPTION_AIRTABLE_TOKEN` / `ADOPTION_AIRTABLE_APP_ID` (cf. `.env.example`, composant Integrant `:adapter/adoption-airtable`).

## Endpoints
| Méthode | Route | Accès | Rôle |
|---|---|---|---|
| GET | `/api/adoption/status` | authentifié | matrice (programs + rows normalisées) |
| GET | `/api/adoption/programmes` | authentifié | fiches programmes + agenda |
| POST | `/api/adoption/registrations` | authentifié | soumettre des emails de participants |
| GET | `/api/adoption/registrations` | **ADMIN** | lister les inscriptions |

Erreurs Airtable propagées proprement : 502 (erreur/injoignable), 503 (token non configuré). Token manquant → 503, jamais un 401 Airtable brut.

## Inscriptions
Persistées dans Postgres (`program_registrations`, migration 012, emails en JSONB), consultables dans **Admin → Inscriptions**. Notification email best-effort à l'admin (`ADMIN_EMAIL`), qui ne bloque jamais l'inscription. Les emails sont nettoyés côté serveur (trim, validation, déduplication).

## Limites connues (données réelles de la base)
- **Nom de société** : `dash_adopt.Company` est un lien (record id), pas un texte. `companyName` est dérivé au mieux : lookup `Name (from Company)` s'il existe → sinon nom de fichier du logo → sinon `Métier (from Company)`. **Amélioration** : ajouter un lookup `Name (from Company)` dans `dash_adopt` (le code le préfère déjà).
- **Agenda** : la table n'a pas de champs `duration` / `odj` (listés dans la spec) ; seuls Numéro / Événement / Date sont affichés.
- Ordre des lignes / programmes : colonne **RANK** de `pgm_adopt` (ordre de présentation maintenu par le client), pour la matrice et les fiches. Programmes sans rang → en fin de liste ; entrées sans programme rattaché → ligne « Non rattaché ».

## Tests
- Frontend (vitest) : `packages/frontend/src/components/adoption/buildAdoptionMatrix.test.ts`
- Backend (clojure.test) : `packages/backend/test/aicn/adoption_test.clj` — `clojure -M:test`
- Intégration (endpoints live) : voir la section vérification du plan / le script `adoption_integration.sh`.
