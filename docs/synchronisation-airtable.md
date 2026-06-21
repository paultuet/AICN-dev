# Documentation du processus de synchronisation Airtable

## Comment fonctionne la synchronisation ?

### Principe général

La synchronisation récupère **toutes les données** depuis Airtable et **remplace** les fichiers locaux. C'est une synchronisation "complète" (full sync), pas un merge.

### Tables synchronisées

- `Tables Sources` — structure des référentiels (entités, champs, clés étrangères / références LOV)
- `lov_new` — listes de valeurs (colonnes `id_code`, `Value`, `complement_value`, `lov_table`)

### Stockage des données

Les données Airtable sont stockées dans des fichiers **JSON**, dans le répertoire défini par la
variable d'environnement `DATA_DIR` :

- En local : `packages/backend/resources/data/` (valeur par défaut)
- En production (Fly.io) : `/data/cache`, sur le **volume persistant** (cf. `fly.toml`), pour que le
  cache survive aux redémarrages de la machine.

```
$DATA_DIR/
├── Tables-Sources.json
└── lov_new.json
```

Si aucune synchronisation n'a encore été lancée, l'application retombe sur une copie « seed » embarquée
dans l'image Docker (les mêmes fichiers JSON committés au dépôt sous `packages/backend/resources/data/`).
Une synchro réussie **remplace** le fichier sur le volume.

**Important** : Ces données ne sont PAS stockées en base de données PostgreSQL.

> Après une synchro, la réponse de `POST /api/sync` renvoie le nombre de lignes récupérées par table
> (et, pour `lov_new`, le nombre de listes distinctes). C'est le moyen de vérifier qu'une synchro a bien
> ramené les données attendues (ex. `lov_new : 218 lignes, 17 listes`).

---

## Puis-je modifier Airtable progressivement ou dois-je tout faire d'un coup ?

**Les deux approches fonctionnent de la même manière.**

Que vous fassiez 1 modification ou 100 modifications dans Airtable avant de lancer la sync, le résultat sera le même : toutes les données actuelles d'Airtable seront récupérées.

### Recommandation

Vous pouvez modifier Airtable à votre rythme. Lancez la synchronisation quand vous êtes satisfait de vos modifications.

---

## Comment lancer une synchronisation ?

Depuis l'administration un bouton pour synchroniser est accessible.

Techniquement la synchronisation se fait via l'API :

```
POST /api/sync
```

Cette route est **réservée aux administrateurs**.

---

## Qu'advient-il des conversations ?

### Les conversations sont INDÉPENDANTES d'Airtable

Les conversations sont stockées en base de données PostgreSQL, séparément des données Airtable.

### Lien avec les éléments du référentiel

Chaque conversation est liée à des éléments via leur `entityId` (l'identifiant Airtable unique, ex: `rec6swjVPgzMej4u8`).

### Comportement lors d'une synchronisation

| Situation | Comportement |
|-----------|--------------|
| Un élément est modifié dans Airtable | La conversation reste liée (même entityId) |
| Un élément est renommé dans Airtable | La conversation reste liée (même entityId) |
| Un élément est supprimé dans Airtable | La conversation devient "orpheline" mais reste en base |

### Conversations orphelines

Si un `entityId` disparaît d'Airtable, les conversations associées :
- Restent consultables en base de données
- Ne s'affichent plus dans l'interface (car l'élément n'existe plus)
- Ne sont jamais supprimées automatiquement

**Comme vous l'avez mentionné** : les conversations sont sauvegardées ailleurs immédiatement après leur création, donc même si elles deviennent orphelines ici, elles ne sont pas perdues.

---

## Résumé

| Question | Réponse |
|----------|---------|
| Dois-je tout modifier d'un coup ? | Non, modifiez à votre rythme |
| La sync écrase-t-elle les anciennes données ? | Oui, c'est un remplacement complet |
| Les conversations sont-elles affectées ? | Non, elles sont en base PostgreSQL |
| Que se passe-t-il si un champ disparaît ? | La conversation devient orpheline mais reste en base |
