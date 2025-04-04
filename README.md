# Port de Plaisance – Version 1.1 🚵️

Cette version étend la base du projet avec la **gestion des catways** et un **aperçu rapide dans le tableau de bord**.

## ✨ Fonctionnalités disponibles

- ✅ Connexion utilisateur via email et mot de passe  
- ✅ Création, modification et suppression d'utilisateurs  
- ✅ Liste des utilisateurs  
- ✅ Tableau de bord après connexion  
- ✅ Consultation de la liste des catways  
- ✅ Détail, création, modification et suppression de catways

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
Version en ligne : https://evaluation-api-port-russell.onrender.com/

---

## 📁 Structure principale

```
- app.js
- routes/
  └── users.js
  └── catways.js
- data/
  ├── catwaysData.json
  └── importCatways.js
- views/
  ├── membres/
  │   ├── usersForm.ejs
  │   └── usersList.ejs
  ├── catways/
  │   ├── catwaysForm.ejs
  │   ├── catwaysList.ejs
  │   └── catwaysDetails.ejs
  ├── dashboard/
  │   └── index.ejs
  ├── layouts/
  │   ├── layout.ejs
  │   └── dashboard.ejs
  ├── error.ejs
  └── home.ejs
```

---

## 🦚 Données initiales

Le projet contient des **données pré-remplies** pour permettre les tests dès le démarrage.

Ces fichiers sont situés dans le dossier `/data` :
- `catwaysData.json` – Liste des catways
- `importCatways.js` – Script d’import associé

✅ Ces scripts ont été utilisés **uniquement pour remplir la base MongoDB lors du développement**.  
Aucune action n’est nécessaire de votre part : **les données sont déjà présentes dans la base distante**.

---

## 🧪 À tester

- Connexion via `/` (accueil)
- Tableau de bord `/dashboard` (aperçu catways)
- Liste des catways `/catways`
- Formulaire de création `/catways/new`
- Modification et suppression de catways