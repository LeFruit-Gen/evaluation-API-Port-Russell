const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const User = require('../models/users');
const jwt = require('jsonwebtoken');
const isAuthenticated = require('../middlewares/authMiddleware');

// GET /users - Liste des utilisateurs
router.get('/', isAuthenticated, async (req, res) => {
    try {
        const users = await User.find({}, '-password');
        res.render('membres/usersList', {
            users,
            currentPage: 'users',
            currentUser: req.user,
            message: req.flash('success'),
            error: req.flash('error'),
            layout: 'layouts/layout'
        });
    } catch (error) {
        console.error(error);
        req.flash('error', 'Erreur lors de la récupération des utilisateurs');
        res.redirect('/dashboard');
    }
});

// POST /users/login - Connexion d'un utilisateur
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });

        if (!user || !(await bcrypt.compare(password, user.password))) {
            req.flash('error', 'Email ou mot de passe incorrect');
            return res.redirect('/dashboard');
        }

        const token = jwt.sign(
            { userId: user._id, email: user.email },
            process.env.JWT_SECRET || 'your-secret-key',
            { expiresIn: '24h' }
        );

        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production'
        });

        req.flash('success', 'Connexion réussie');
        res.redirect('/dashboard');
    } catch (error) {
        console.error(error);
        req.flash('error', 'Erreur lors de la connexion');
        res.redirect('/dashboard');
    }
});

// POST /users/logout - Déconnexion d'un utilisateur
router.post('/logout', (req, res) => {
    res.clearCookie('token');
    req.flash('success', 'Déconnexion réussie');
    res.redirect('/');
});

module.exports = router;