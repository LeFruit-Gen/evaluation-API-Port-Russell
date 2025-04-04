# Port de Plaisance – Version 1.0 🛥️

Cette version est une base minimaliste du projet. Elle permet la gestion simple des utilisateurs avec une authentification et un tableau de bord de connexion.

## ✨ Fonctionnalités disponibles

- ✅ Connexion utilisateur via email et mot de passe
- ✅ Création, modification et suppression d'utilisateurs
- ✅ Liste des utilisateurs
- ✅ Tableau de bord après connexion

## 🔒 Authentification

Connexion via un token JWT stocké dans un cookie HTTP.

### Identifiants de test

> Ces comptes permettent d'accéder aux différentes parties de l'application :

- **Administrateur**  
  Email : `admin@example.com`  
  Mot de passe : `admin123`

- **Utilisateur standard**  
  Email : `user@example.com`  
  Mot de passe : `user123`

---

## ⚙️ Installation du projet

```bash
git clone https://github.com/LeFruit-Gen/evaluation-API-Port-Russell.git
cd nom-du-projet
npm install
```

---

## 📄 Configuration

Un fichier `.env` est requis pour faire fonctionner l’application.  
Les fichiers de configuration se trouvent dans le dossier `.env/` :

- `.env` – version locale utilisée pour le développement
- `.env.dev` – configuration de test
- `.env.prod` – configuration de production

```env
PORT=3000
URL_MONGO=mongodb+srv://<user>:<password>@cluster...
JWT_SECRET=...
```

💡 Ce fichier **n’est pas fourni** dans le repo GitHub pour des raisons de sécurité. Il sera transmis séparément.
> Seul le fichier `.env` est utilisé dans cette version.  
> Les fichiers `.env.dev` et `.env.prod` ont été prévus pour une future séparation des environnements.

---

## ▶️ Lancer le projet

```bash
npm install
npm start
```

Le projet sera disponible sur [http://localhost:3000](http://localhost:3000)

## 📁 Structure principale

```
- app.js
- routes/
  └── users.js
- views/
  ├── membres/
  │   ├── usersForm.ejs
  │   └── usersList.ejs
  ├── layouts/
  │   ├── layout.ejs
  │   └── dashboard.ejs
  ├── error.ejs
  └── home.ejs
```

## 🧪 À tester

- Se connecter depuis la page d'accueil (`/`)
- Naviguer vers `/dashboard` une fois connecté
- Accéder à `/users` pour gérer les utilisateurs

---

📌 Cette version **ne contient pas** la gestion des catways ni des réservations.  
C’est une base fonctionnelle de gestion d’utilisateurs uniquement.