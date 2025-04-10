const express = require('express');
const mongoose = require('mongoose');
const usersRoutes = require('./routes/users');
require("dotenv").config({ path: "./.env/.env" });
const flash = require('connect-flash');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');
const methodOverride = require('method-override');
const path = require('path');
const expressLayouts = require('express-ejs-layouts');
const isAuthenticated = require('./middlewares/authMiddleware');

const app = express();

// Configuration d'EJS
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(expressLayouts);
app.set('layout', 'layouts/layout');

// Middleware pour parser le corps des requêtes
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Configuration de method-override
app.use(methodOverride(function (req, res) {
  if (req.body && typeof req.body === 'object' && '_method' in req.body) {
    const method = req.body._method;
    delete req.body._method;
    return method;
  }
}));

// Configuration du cookie parser
app.use(cookieParser(process.env.JWT_SECRET));

// Configuration de la session
const sessionConfig = {
  secret: process.env.SESSION_SECRET || 'default_session_secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 heures
  }
};
app.use(session(sessionConfig));

// Configuration de connect-flash
app.use(flash());

// Connexion à MongoDB
mongoose.connect(process.env.URL_MONGO)
  .then(() => console.log('Connexion à MongoDB réussie'))
  .catch((err) => console.log('Erreur de connexion à MongoDB:', err));

// Servir les fichiers statiques
app.use(express.static(path.join(__dirname, 'public')));

// Routes publiques
app.get('/', (req, res) => {
  res.render('home', {
    currentUser: req.user,
    message: req.flash('success'),
    error: req.flash('error')
  });
});

// Routes d'authentification et utilisateurs
app.use('/', usersRoutes); // Pour login/logout
app.use('/users', usersRoutes); // Pour la gestion des utilisateurs

// Route du tableau de bord
app.get('/dashboard', isAuthenticated, async (req, res) => {
  try {
    res.render('dashboard/index', {
      currentUser: req.user,
      currentPage: 'dashboard',
      message: req.flash('success'),
      error: req.flash('error'),
      layout: 'layouts/dashboard'
    });
  } catch (error) {
    console.error('Erreur dashboard:', error);
    res.render('error', {
      error: 'Une erreur est survenue lors du chargement du tableau de bord',
      layout: 'layouts/layout'
    });
  }
});

// Gestion des erreurs 404
app.use((req, res, next) => {
  res.status(404).render('error', {
    error: 'Page non trouvée',
    layout: 'layouts/layout'
  });
});

// Gestion des erreurs serveur
app.use((err, req, res, next) => {
  console.error('Erreur serveur:', err);
  res.status(500).render('error', {
    error: err.message || 'Une erreur est survenue',
    layout: 'layouts/layout'
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Serveur démarré sur le port ${PORT}`);
});

module.exports = app;