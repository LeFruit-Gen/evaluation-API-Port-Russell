# ⚓ API - Gestion du Port de Plaisance (Capitainerie)

Application interne destinée à la capitainerie du port de plaisance, permettant la gestion des catways, des réservations de catways et des utilisateurs via une interface sécurisée.  
Accessible uniquement aux membres autorisés.

---

## 🚀 Fonctionnalités

- Authentification avec token JWT
- Interface d'administration complète (CRUD) pour :
  - Les catways
  - Les réservations
  - Les utilisateurs
- Accès restreint par rôle (`admin` ou `user`)
- Dashboard avec vue en temps réel des réservations
- Documentation API intégrée (accessible aux admins)

---

## ⚙️ Installation du projet

```bash
git clone https://github.com/LeFruit-Gen/evaluation-API-Port-Russell.git
cd evaluation-API-Port-Russell
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

Ce fichier **n’est pas fourni** dans le repo GitHub pour des raisons de sécurité. Il sera transmis séparément.
> Seul le fichier `.env` est utilisé dans cette version.  
> Les fichiers `.env.dev` et `.env.prod` ont été prévus pour une future séparation des environnements.

---

## 🧪 Lancement de l'application

```bash
npm start
```

L'application est disponible aux adresses suivantes :
- **Version locale** : [http://localhost:3000](http://localhost:3000)
- **Version en ligne** : [https://port-plaisance-qv88.onrender.com](https://port-plaisance-qv88.onrender.com)

---

## 🔐 Identifiants de test

> Ces comptes permettent d'accéder aux différentes parties de l'application :

- **Administrateur**  
  Email : `admin@example.com`  
  Mot de passe : `admin123`

- **Utilisateur standard**  
  Email : `user@example.com`  
  Mot de passe : `user123`

---

## 📚 Documentation de l’API

Accessible uniquement aux administrateurs connectés, via :  
[http://localhost:3000/api/docs](http://localhost:3000/api/docs)

Contient toutes les routes, rôles, erreurs, et exemples de requêtes.

---

## 📂 Données initiales

Le projet contient des **données pré-remplies** pour permettre les tests dès le démarrage.

Ces fichiers sont situés dans le dossier `/data` :
- `catwaysData.json` – Liste des catways
- `reservationsData.json` – Réservations associées
- `importCatways.js` / `importReservations.js` – Scripts d’import

✅ Ces scripts ont été utilisés **uniquement pour remplir la base MongoDB lors du développement**.  
Aucune action n’est nécessaire de votre part : **les données sont déjà présentes dans la base distante**.

---

## 📁 Structure du projet (simplifiée)

```
├── app.js
├── .env/
├── data/                # JSON + scripts d'import
├── models/              # Mongoose schemas
├── routes/              # Catways, reservations, users
├── views/               # Vues EJS
├── public/              # CSS, images
├── middlewares/
└── README.md
```

---

## ℹ️ Remarques importantes

- Seul le champ `catwayState` est modifiable après création d’un catway (pas le type ni le numéro).
- Les utilisateurs peuvent modifier leurs propres données, mais seul un administrateur peut changer les rôles.
- Les utilisateurs ne voient que leurs propres réservations.
- L’accès à la documentation est restreint aux administrateurs.
- Les scripts d'import dans `/data` ne sont plus nécessaires (base déjà remplie).

---

## 👤 Auteur

Projet réalisé par **[Cyril / TAMISIER]**  