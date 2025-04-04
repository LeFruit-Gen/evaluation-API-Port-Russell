const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const expressLayouts = require('express-ejs-layouts');
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');
require('dotenv').config({ path: './.env/.env' });
const session = require('express-session');
const flash = require('connect-flash');

const app = express();

// Configuration du moteur de vues EJS
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(expressLayouts);
app.set('layout', 'layouts/layout');

// Middleware pour parser le corps des requêtes
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Middleware pour les cookies
app.use(cookieParser(process.env.JWT_SECRET));

// Middleware pour les sessions (requis par flash)
app.use(session({
  secret: process.env.SESSION_SECRET || 'une_clé_secrète',
  resave: false,
  saveUninitialized: true
}));

// Middleware flash
app.use(flash());

// Injection des messages flash dans les vues
app.use((req, res, next) => {
  res.locals.message = req.flash('success');
  res.locals.error = req.flash('error');
  next();
});

// Middleware JWT pour l'authentification
app.use((req, res, next) => {
  const token = req.cookies.token;
  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
      req.user = decoded;
    } catch (err) {
      res.clearCookie('token');
    }
  }
  next();
});

// Rendre l'utilisateur dispo dans les vues EJS
app.use((req, res, next) => {
  res.locals.user = req.user || null;
  next();
});

// Fichiers statiques
app.use(express.static(path.join(__dirname, 'public')));

// Connexion MongoDB
mongoose.connect(process.env.URL_MONGO)
  .then(() => console.log('Connexion à MongoDB réussie'))
  .catch((err) => console.error('Erreur de connexion à MongoDB :', err));


// Routes
const usersRoutes = require('./routes/users');
app.use('/users', usersRoutes);

// Accueil
app.get('/', (req, res) => {
  res.render('home', { layout: false });
});

// Dashboard
app.get('/dashboard', (req, res) => {
  res.render('layouts/dashboard', {
    title: 'Tableau de bord',
    layout: false
  });
});

// Gestion des erreurs
app.use((req, res) => {
  res.status(404).render('error', {
    error: 'Page non trouvée',
    layout: 'layouts/layout'
  });
});

app.use((err, req, res, next) => {
  console.error('Erreur serveur :', err.stack);
  res.status(500).render('error', {
    error: 'Erreur serveur',
    layout: 'layouts/layout'
  });
});

// Démarrage du serveur
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Serveur démarré sur le port ${PORT}`);
});

module.exports = app;