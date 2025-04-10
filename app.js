const express = require('express');
const mongoose = require('mongoose');
const catwayRoutes = require('./routes/catways');
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
app.use(cookieParser(process.env.JWT_SECRET)); 

// Configuration de method-override
app.use(methodOverride(function (req, res) {
  if (req.body && typeof req.body === 'object' && '_method' in req.body) {
    const method = req.body._method;
    delete req.body._method;
    return method;
  }
}));

// Configuration des sessions et des messages flash
app.use(session({
    secret: process.env.SESSION_SECRET || 'secret_key',
    resave: false,
    saveUninitialized: false
}));
app.use(flash());

// Middleware d'authentification
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

// Middleware pour passer user à toutes les vues
app.use((req, res, next) => {
    res.locals.user = req.user || null;
    res.locals.message = req.flash('message');
    next();
});

// Connexion à MongoDB
mongoose.connect(process.env.URL_MONGO)
  .then(() => console.log('Connexion à MongoDB réussie'))
  .catch((err) => console.error('Erreur de connexion à MongoDB:', err));

// Configuration des en-têtes CORS
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content, Accept, Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    next();
});

// Montage des routes
app.use('/users', usersRoutes);
app.use('/catways', catwayRoutes);

// Route par défaut
app.get('/', (req, res) => {
    if (req.user) {
        res.redirect('/dashboard');
    } else {
        res.render('home', { layout: false });
    }
});

// Route du tableau de bord
app.get('/dashboard', isAuthenticated, async (req, res) => {
    try {
        const Catway = require('./models/catways');

        // Statistiques de base des catways
        const totalCatways = await Catway.countDocuments();
        const occupiedCatways = await Catway.countDocuments({ status: 'occupé' });
        const availableCatways = totalCatways - occupiedCatways;

        const stats = {
            totalCatways,
            occupiedCatways,
            availableCatways
        };

        res.render('dashboard/index', {
            title: 'Tableau de bord',
            stats,
            currentPage: 'dashboard',
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

// Gestion des erreurs 404
app.use((req, res) => {
    res.status(404).render('error', {
        error: 'Page non trouvée',
        layout: 'layouts/layout'
    });
});

// Gestion des erreurs 500
app.use((err, req, res, next) => {
    console.error('Erreur serveur:', err.stack);
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