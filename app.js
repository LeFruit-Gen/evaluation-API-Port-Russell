const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const methodOverride = require('method-override');
const expressLayouts = require('express-ejs-layouts');
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');
require("dotenv").config({ path: "./.env/.env" });
const session = require('express-session');
const flash = require('connect-flash');

const app = express(); // <-- doit venir avant tous les app.use()

// Configuration du moteur de vues EJS
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(expressLayouts);
app.set('layout', 'layouts/layout');
app.set('layout extractScripts', true);
app.set('layout extractStyles', true);

// Middleware pour parser le corps des requêtes
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Middleware pour les cookies
app.use(cookieParser(process.env.JWT_SECRET));

// Middleware pour les sessions (nécessaire pour flash)
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

// Middleware pour authentifier via JWT
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

// Injection de l’utilisateur dans les vues
app.use((req, res, next) => {
  res.locals.user = req.user || null;
  res.locals.currentUser = req.user || null;
  next();
});

// Method override pour les formulaires HTML
app.use(methodOverride((req, res) => {
  if (req.body && typeof req.body === 'object' && '_method' in req.body) {
    const method = req.body._method;
    delete req.body._method;
    return method;
  }
}));

// Fichiers statiques
app.use(express.static(path.join(__dirname, 'public')));

// Connexion MongoDB
mongoose.connect(process.env.URL_MONGO)
  .then(() => console.log('Connexion à MongoDB réussie'))
  .catch((err) => console.error('Erreur de connexion à MongoDB:', err));

// CORS (optionnel si API publique)
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content, Accept, Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  next();
});

// Routes
const catwayRoutes = require('./routes/catways');
const usersRoutes = require('./routes/users');

app.use('/users', usersRoutes);
app.use('/catways', catwayRoutes);

// Page d'accueil
app.get('/', (req, res) => {
  res.render('home', { layout: false });
});

// Dashboard
app.get('/dashboard', async (req, res) => {
  try {
    const Catway = require('./models/catways');

    const totalCatways = await Catway.countDocuments();
    const occupiedCatways = await Catway.countDocuments({ status: 'occupé' });
    const availableCatways = totalCatways - occupiedCatways;

    res.render('dashboard/index', {
      title: 'Tableau de bord',
      stats: { totalCatways, occupiedCatways, availableCatways },
      layout: 'layouts/dashboard'
    });
  } catch (err) {
    console.error('Erreur serveur:', err.stack);
    res.status(500).render('error', {
      error: 'Erreur serveur',
      layout: 'layouts/layout'
    });
  }
});

// Erreurs
app.use((req, res) => {
  res.status(404).render('error', {
    error: 'Page non trouvée',
    layout: 'layouts/layout'
  });
});

app.use((err, req, res, next) => {
  console.error('Erreur serveur:', err.stack);
  res.status(500).render('error', {
    error: 'Erreur serveur',
    layout: 'layouts/layout'
  });
});

// Démarrage
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Serveur démarré sur le port ${PORT}`);
});

module.exports = app;