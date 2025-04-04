# Port de Plaisance – Version 1.2 ⚓

Cette version étend la base de gestion des utilisateurs en ajoutant la gestion complète des **réservations de catways**.

## ✨ Fonctionnalités ajoutées

- ✅ Ajout d’une réservation pour un catway spécifique
- ✅ Consultation des réservations par catway
- ✅ Modification et suppression d’une réservation
- ✅ Vue globale de toutes les réservations

## 📂 Données initiales

Le projet contient des **données pré-remplies** pour permettre les tests dès le démarrage.

Ces fichiers sont situés dans le dossier `/data` :
- `catwaysData.json` – Liste des catways
- `reservationsData.json` – Réservations associées
- `importCatways.js` / `importReservations.js` – Scripts d’import

✅ Ces scripts ont été utilisés **uniquement pour remplir la base MongoDB lors du développement**.  
Aucune action n’est nécessaire de votre part : **les données sont déjà présentes dans la base distante**.

---

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
  ├── users.js
  ├── catways.js
  ├── reservations.js
  └── reservationsGlobal.js
- views/
  ├── membres/
  │   ├── usersForm.ejs
  │   └── usersList.ejs
  ├── catways/
  │   ├── catwaysForm.ejs
  │   ├── catwaysList.ejs
  │   └── catwaysDetail.ejs
  ├── reservations/
  │   ├── reservationsForm.ejs
  │   ├── reservationsList.ejs
  │   └── allReservations.ejs
  ├── dashboard/
  │   └── index.ejs
  ├── layouts/
  │   ├── layout.ejs
  │   └── dashboard.ejs
  ├── error.ejs
  └── home.ejs
```

> 📝 Les fichiers `reservationsGlobal.js` et `allReservations.ejs` ont été ajoutés pour répondre à la demande de visualiser toutes les réservations de manière centralisée.  
> Bien que cela **ne respecte pas strictement les conventions REST**, cette approche facilite les tests et l’accès aux données.

---

## 🧪 À tester

- Accéder à un catway et créer une réservation (`/catways/:id/reservations/new`)
- Modifier ou supprimer une réservation spécifique
- Visualiser toutes les réservations depuis `/reservations/all`