# Guide d'administration

Ce guide couvre les operations courantes d'administration de la plateforme ECR.

## Acces a l'administration

L'interface d'administration est accessible depuis le menu principal pour les utilisateurs ayant le role **ADMIN**. Elle comprend trois onglets : Utilisateurs, Logs d'activite et Synchronisation Airtable.

## Gestion des utilisateurs

### Inscription

Les utilisateurs s'inscrivent via le formulaire d'inscription avec : email, mot de passe, nom et organisation. Un email de verification est envoye automatiquement (valide 24h). La connexion n'est possible qu'apres verification de l'email.

### Roles

| Role | Acces |
|------|-------|
| **USER** | Consultation des referentiels, conversations, telechargement de fichiers |
| **ADMIN** | Tout ce qui precede + gestion utilisateurs, logs d'activite, synchronisation Airtable, upload/suppression de fichiers |

Le role par defaut a l'inscription est **USER**. Le changement de role se fait en base de donnees :

```sql
UPDATE users SET role = 'ADMIN' WHERE email = 'admin@example.com';
```

### Consultation des utilisateurs

L'onglet **Utilisateurs** de l'administration affiche la liste de tous les comptes :
- Nom, email, organisation
- Role (USER / ADMIN)
- Statut de verification de l'email
- Date de creation

### Reinitialisation de mot de passe

Les utilisateurs peuvent reinitialiser leur mot de passe via le lien "Mot de passe oublie" sur la page de connexion. Un email contenant un lien de reinitialisation (valide 1h) leur est envoye.

## Synchronisation Airtable

### Declenchement

Depuis l'onglet **Airtable** de l'administration, cliquer sur le bouton de synchronisation. Une confirmation est demandee avant execution.

La synchronisation recupere l'integralite des donnees depuis Airtable et remplace les fichiers locaux. C'est une synchronisation complete (full sync).

Voir [synchronisation-airtable.md](synchronisation-airtable.md) pour le detail du processus et l'impact sur les conversations.

### Tables synchronisees

| Table Airtable | Contenu |
|----------------|---------|
| `liens-niveaux` | Mappings hierarchiques (NIV1 > NIV2 > NIV3 > NIV4) |
| `lov` | Listes de valeurs |
| `cat_ref` | Categories de reference |
| `ref_list` | Liste maitresse des enregistrements |

### Prerequis

Les variables `AIRTABLE_TOKEN` et `AIRTABLE_APP_ID` doivent etre configurees. Pour obtenir ces valeurs :
1. Se connecter a [Airtable](https://airtable.com)
2. Aller dans les parametres du compte > Tokens API
3. Creer un token avec acces en lecture a la base de referentiels
4. L'App ID se trouve dans l'URL de la base : `https://airtable.com/appXXXXXXXX/...`

## Gestion des fichiers

### Upload de fichiers

Depuis l'interface de gestion des fichiers (accessible aux admins), il est possible d'uploader des documents avec :
- Un ou plusieurs fichiers
- Un titre
- Une version
- Une categorie
- Une date d'upload

Les fichiers sont stockes :
- **En local** : dans le repertoire `uploads/`
- **En production** : sur le volume persistant Fly.io (`/data/uploads`)

### Suppression

La suppression d'un fichier est definitive : le fichier est retire du disque et de la base de donnees. L'operation est tracee dans les logs d'activite.

## Logs d'activite

L'onglet **Logs d'activite** fournit un audit complet des actions sur la plateforme.

### Types d'activites tracees

| Type | Description | Couleur |
|------|-------------|---------|
| `login-success` | Connexion reussie | Vert |
| `login-failed` | Tentative de connexion echouee | Rouge |
| `conversation-created` | Creation d'une conversation | Bleu |
| `message-sent` | Envoi d'un message | Violet |
| `file-uploaded` | Upload d'un fichier | Turquoise |
| `file-deleted` | Suppression d'un fichier | Orange |

### Filtres disponibles

- Par type d'activite
- Par email utilisateur

### Statistiques affichees

- Nombre total de logs
- Activite des dernieres 24h, 7 jours, 30 jours
- Nombre d'utilisateurs uniques
- Repartition par type

### Export

Les logs peuvent etre exportes en CSV (jusqu'a 1000 enregistrements) depuis l'interface.

## Monitoring

### Endpoint de sante

```
GET /api/health
```

Retourne `{"status": "ok", "timestamp": "..."}`. Cet endpoint est utilise par Fly.io pour les health checks automatiques (toutes les 10 secondes).

### Logs applicatifs

En production sur Fly.io :

```bash
fly logs              # Logs en temps reel
fly logs --app aicn-app  # Si plusieurs apps configurees
```

Le niveau de log est configurable via la variable `LOG_LEVEL` (defaut : `info`).

### Etat de l'application

```bash
fly status            # Etat general (machines, deploiement)
fly ssh console       # Acces SSH a l'instance
fly apps restart      # Redemarrage de l'application
```

## Sauvegarde de la base de donnees

La sauvegarde de PostgreSQL depend du fournisseur utilise. Voici les commandes generiques :

```bash
# Export complet de la base
pg_dump -h <host> -U <user> -d <dbname> > backup_$(date +%Y%m%d).sql

# Restauration
psql -h <host> -U <user> -d <dbname> < backup.sql
```

En production, il est recommande de mettre en place des sauvegardes automatiques aupres de votre fournisseur PostgreSQL.

## Configuration des emails

L'application envoie des emails pour :
- La verification de compte a l'inscription
- L'email de bienvenue apres verification
- La reinitialisation de mot de passe

Les variables SMTP necessaires :

| Variable | Description |
|----------|-------------|
| `EMAIL_HOST` | Serveur SMTP (ex: `smtp.gmail.com`) |
| `EMAIL_PORT` | Port SMTP (defaut: `587`) |
| `EMAIL_USERNAME` | Identifiant SMTP |
| `EMAIL_PASSWORD` | Mot de passe SMTP |
| `EMAIL_FROM` | Adresse d'expedition |

La connexion SMTP utilise TLS.

## Securite

### Tokens JWT

Les tokens d'authentification expirent apres **1 heure**. L'algorithme utilise est HMAC SHA-512. La cle secrete est configuree via `JWT_SECRET`.

Pour generer une cle secrete robuste :

```bash
openssl rand -base64 64
```

### Mots de passe

Les mots de passe sont hashes avec bcrypt + blake2b-512 (12 iterations). Ils ne sont jamais stockes en clair.
