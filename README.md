# 🔒 Securisation Site - API Node.js/Express/Supabase

Projet scolaire complet : API sécurisée pour gestion d’utilisateurs, rôles, produits Shopify, webhooks, et authentification avancée (JWT + clés API).

## 🚀 Fonctionnalités principales

- Authentification JWT (1h) + gestion de l’expiration immédiate si changement de mot de passe
- Authentification par clé API (x-api-key) pour systèmes externes
- Gestion des rôles (ADMIN, PREMIUM, USER, BAN) et permissions fines
- Création/gestion de produits synchronisés avec Shopify (API Admin)
- Webhook sécurisé (HMAC) pour incrémenter les ventes produits
- Upload d’image produit (PREMIUM)
- Endpoint bestsellers trié par ventes (PREMIUM)
- Sécurité : rate limiting, helmet, CORS, validation Zod, logs Winston

## 🏗️ Stack technique

- Node.js 18+ / Express 4
- TypeScript 5
- Supabase (PostgreSQL)
- Shopify Admin API (2025-10)
- JWT, Bcrypt, Winston, Zod, Helmet, express-rate-limit

## 📦 Installation & Lancement

1. **Cloner le repo**

```bash
git clone https://github.com/TerukiIIM/secure_website.git
cd securisation_site
```

2. **Installer les dépendances**

```bash
npm install
```

3. **Configurer l’environnement**

- Copier `.env.example` en `.env` et remplir les variables (Supabase, Shopify, JWT...)

4. **Créer la base de données**

- Lancer le script SQL `sql/setup.sql` dans Supabase
- Lancer le seed :

```bash
npm run seed
```

5. **Démarrer le serveur**

```bash
npm run dev
```

## 🔑 Comptes de test

- **Admin** : admin@example.com / Password123!
- **Premium** : premium@example.com / Password123!
- **User** : user@example.com / Password123!
- **Ban** : banned@example.com / Password123!

## 🔗 Endpoints principaux

| Méthode | Route                   | Permission          | Description                 |
| ------- | ----------------------- | ------------------- | --------------------------- |
| GET     | /health                 | -                   | Test API                    |
| POST    | /register               | -                   | Inscription                 |
| POST    | /login                  | can_post_login      | Connexion JWT               |
| GET     | /my-user                | can_get_my_user     | Infos utilisateur           |
| PATCH   | /my-user/password       | can_post_login      | Changer mot de passe        |
| GET     | /users                  | can_get_users       | Liste users                 |
| POST    | /products               | can_post_products   | Créer produit (Shopify)     |
| GET     | /my-products            | -                   | Mes produits                |
| GET     | /products               | -                   | Tous les produits           |
| GET     | /my-bestsellers         | can_get_bestsellers | Mes bestsellers (PREMIUM)   |
| POST    | /products/:id/add-sale  | can_get_bestsellers | Ajouter ventes manuellement |
| POST    | /api-keys               | -                   | Générer clé API             |
| GET     | /api-keys               | -                   | Lister clés API             |
| DELETE  | /api-keys/:id           | -                   | Supprimer clé API           |
| POST    | /webhooks/shopify-sales | HMAC                | Webhook Shopify             |

> Authentification :
>
> - JWT : `Authorization: Bearer <token>`
> - Clé API : `x-api-key: sk_live_...`

## 🛡️ Sécurité

- Bcrypt salt 12 pour les mots de passe et clés API
- JWT 1h, invalidation immédiate si changement de mot de passe
- Rate limiting global (100 req/15min) + login (1 tentative/5s)
- Helmet, CORS, validation Zod sur toutes les entrées
- Logs Winston (console + fichiers)
- Webhook Shopify sécurisé par HMAC (timingSafeEqual)

## 🗄️ Structure de la base de données (extrait)

- **users** : id, name, email, password_hash, role_id, token_version, ...
- **roles** : id, name, can_post_login, can_get_my_user, ...
- **products** : id, shopify_id, name, price, sales_count, image_url, created_by, ...
- **api_keys** : id, user_id, name, key_hash, ...

## 🛠️ Améliorations possibles

- Déploiement cloud (Railway, Render, Vercel...)
- Tests automatisés (Jest, Supertest)
- UI d’administration
- Pagination, recherche avancée
- Gestion des droits plus fine (logs d’audit, etc.)

## 📚 Documentation détaillée

Voir le fichier `DOCUMENTATION.md` pour la description complète de chaque endpoint, payloads, et exemples Postman.

---

**Projet réalisé dans le cadre d’un exercice de sécurisation d'un site web**
