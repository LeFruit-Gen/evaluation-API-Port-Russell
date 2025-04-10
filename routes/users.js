const express = require('express');
const User = require('../models/users');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const isAuthenticated = require('../middlewares/authMiddleware');
const isAdmin = require('../middlewares/isAdmin');
const router = express.Router();

// Afficher le formulaire de création (admin seulement)
router.get('/new', isAuthenticated, isAdmin, (req, res) => {
    res.render('membres/usersForm', {
        user: null,
        message: "Veuillez remplir les informations de l'utilisateur.",
        currentUser: req.user,
        isEditing: false,
        layout: 'layouts/layout'
    });
});

// Afficher le formulaire de modification (admin seulement)
router.get('/edit/:email', isAuthenticated, isAdmin, async (req, res) => {
    try {
        const user = await User.findOne({ email: req.params.email });
        if (!user) {
            return res.status(404).render('error', { 
                error: 'Utilisateur non trouvé',
                layout: 'layouts/layout'
            });
        }
        res.render('membres/usersForm', { 
            user,
            message: null,
            currentUser: req.user,
            isEditing: true,
            layout: 'layouts/layout'
        });
    } catch (err) {
        res.status(400).render('error', { 
            error: `Erreur lors de la recherche de l'utilisateur : ${err.message}`,
            layout: 'layouts/layout'
        });
    }
});

// Afficher le formulaire de modification de rôle (admin seulement)
router.get('/:email/role', isAuthenticated, isAdmin, async (req, res) => {
    try {
        const user = await User.findOne({ email: req.params.email });
        if (!user) {
            return res.status(404).render('error', { 
                error: 'Utilisateur non trouvé',
                layout: 'layouts/layout'
            });
        }
        res.render('membres/changeRole', { 
            user, 
            currentUser: req.user,
            layout: 'layouts/layout'
        });
    } catch (err) {
        res.status(400).render('error', { 
            error: `Erreur lors de la recherche de l'utilisateur : ${err.message}`,
            layout: 'layouts/layout'
        });
    }
});

// Création d'un utilisateur (admin seulement)
router.post('/', isAuthenticated, isAdmin, async (req, res) => {
    try {
        const { username, email, password, role } = req.body;
        const existingUser = await User.findOne({ $or: [{ email }, { username }] });
        if (existingUser) {
            return res.render('membres/usersForm', {
                user: req.body,
                message: "Cet email ou nom d'utilisateur existe déjà",
                currentUser: req.user,
                isEditing: false,
                layout: 'layouts/layout'
            });
        }
        const newUser = new User({ username, email, password, role });
        await newUser.save();
        req.flash('success', 'Utilisateur créé avec succès');
        res.redirect('/users');
    } catch (err) {
        req.flash('error', `Erreur lors de la création : ${err.message}`);
        res.redirect('/users');
    }
});

// Lister tous les utilisateurs (admin seulement)
router.get('/', isAuthenticated, isAdmin, async (req, res) => {
    try {
        const users = await User.find();
        res.render('membres/usersList', {
            users,
            message: req.flash('success'),
            error: req.flash('error'),
            currentUser: req.user,
            layout: 'layouts/layout'
        });
    } catch (err) {
        res.status(400).render('error', { 
            error: `Erreur lors de la récupération des utilisateurs : ${err.message}`,
            layout: 'layouts/layout'
        });
    }
});

// Modifier un utilisateur (admin seulement)
router.put('/:email', isAuthenticated, isAdmin, async (req, res) => {
    try {
        const user = await User.findOne({ email: req.params.email });
        if (!user) {
            return res.status(404).render('error', {
                error: 'Utilisateur non trouvé',
                layout: 'layouts/layout'
            });
        }

        // Mettre à jour les informations de l'utilisateur
        user.username = req.body.username;
        user.email = req.body.email;

        // Ne mettre à jour le mot de passe que s'il est fourni
        if (req.body.password && req.body.password.trim() !== '') {
            const hashedPassword = await bcrypt.hash(req.body.password, 10);
            user.password = hashedPassword;
        }

        await user.save();
        req.flash('success', 'Utilisateur modifié avec succès');
        res.redirect('/users');
    } catch (err) {
        if (err.code === 11000) {
            // Erreur de doublon (email déjà utilisé)
            return res.render('membres/usersForm', {
                user: { ...req.body },
                message: "Cet email est déjà utilisé",
                currentUser: req.user,
                isEditing: true,
                layout: 'layouts/layout'
            });
        }
        res.status(400).render('error', {
            error: `Erreur lors de la modification de l'utilisateur : ${err.message}`,
            layout: 'layouts/layout'
        });
    }
});

// Modification du rôle d'un utilisateur (admin seulement)
router.put('/:email/role', isAuthenticated, isAdmin, async (req, res) => {
    try {
        const { role } = req.body;
        const user = await User.findOne({ email: req.params.email });
        
        if (!user) {
            req.flash('error', 'Utilisateur non trouvé');
            return res.redirect('/users');
        }

        user.role = role;  // La validation se fait automatiquement via Mongoose
        await user.save();
        
        req.flash('success', 'Rôle modifié avec succès');
        res.redirect('/users');
    } catch (err) {
        // Si la validation échoue, Mongoose enverra une erreur
        req.flash('error', `Erreur lors de la modification du rôle : ${err.message}`);
        res.redirect('/users');
    }
});

// Suppression d'un utilisateur (admin seulement)
router.delete('/:email', isAuthenticated, isAdmin, async (req, res) => {
    try {
        const result = await User.deleteOne({ email: req.params.email });
        if (result.deletedCount === 0) {
            req.flash('error', 'Utilisateur non trouvé');
            return res.redirect('/users');
        }
        req.flash('success', 'Utilisateur supprimé avec succès');
        res.redirect('/users');
    } catch (err) {
        req.flash('error', `Erreur lors de la suppression : ${err.message}`);
        res.redirect('/users');
    }
});

// Route de connexion (publique)
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        
        if (!user || !(await user.isValidPassword(password))) {
            return res.status(401).render('home', {
                error: 'Email ou mot de passe incorrect',
                layout: 'layouts/layout'
            });
        }

        // Création du token JWT
        const token = jwt.sign(
            { userId: user._id, email: user.email, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        // Stockage du token dans un cookie
        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production'
        });

        req.flash('success', 'Connexion réussie');
        res.redirect('/dashboard');
    } catch (err) {
        res.status(400).render('home', {
            error: `Erreur lors de la connexion : ${err.message}`,
            layout: 'layouts/layout'
        });
    }
});

// Route de déconnexion (GET et POST)
router.all('/logout', isAuthenticated, (req, res) => {
    // D'abord nettoyer le cookie
    res.clearCookie('token');
    
    // Ensuite ajouter le message flash (tant que la session existe encore)
    req.flash('success', 'Déconnexion réussie');
    
    // Enfin, détruire la session et rediriger
    req.session.destroy((err) => {
        if (err) {
            res.status(500).render('error', { 
                error: 'Erreur lors de la déconnexion',
                layout: 'layouts/layout'
            });
        }
        res.redirect('/');
    });
});

// Route temporaire pour réinitialiser l'utilisateur test
router.get('/reset-test-user', isAuthenticated, isAdmin, async (req, res) => {
    try {
        // Supprimer l'utilisateur existant
        await User.deleteOne({ email: 'user@example.com' });

        // Créer un nouvel utilisateur
        const newUser = new User({
            username: 'user',
            email: 'user@example.com',
            password: 'user123',
            role: 'user'
        });

        await newUser.save();
        req.flash('success', 'Utilisateur test réinitialisé avec succès');
        res.redirect('/users');
    } catch (err) {
        req.flash('error', `Erreur lors de la réinitialisation : ${err.message}`);
        res.redirect('/users');
    }
});

module.exports = router;