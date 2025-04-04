const express = require('express');
const User = require('../models/users');
const bcrypt = require('bcrypt');
const router = express.Router();
const jwt = require('jsonwebtoken');

// Afficher le formulaire de création
router.get('/new', (req, res) => {
    res.render('membres/usersForm', {
        user: null,
        message: "Veuillez remplir les informations de l'utilisateur.",
        isEditing: false,
        layout: 'layouts/layout'
    });
});

// Afficher le formulaire de modification
router.get('/edit/:email', async (req, res) => {
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

// Création d'un utilisateur
router.post('/', async (req, res) => {
    try {
        const { username, email, password } = req.body;
        const existingUser = await User.findOne({ $or: [{ email }, { username }] });
        if (existingUser) {
            return res.render('membres/usersForm', {
                user: req.body,
                message: "Cet email ou nom d'utilisateur existe déjà",
                isEditing: false,
                layout: 'layouts/layout'
            });
        }
        const newUser = new User({ username, email, password });
        await newUser.save();
        req.flash('success', 'Utilisateur créé avec succès');
        res.redirect('/users');
    } catch (err) {
        req.flash('error', `Erreur lors de la création : ${err.message}`);
        res.redirect('/users');
    }
});

// Lister tous les utilisateurs
router.get('/', async (req, res) => {
    try {
        const users = await User.find();
        res.render('membres/usersList', {
            users,
            message: req.flash('success'),
            error: req.flash('error'),
            layout: 'layouts/layout'
        });
    } catch (err) {
        res.status(400).render('error', { 
            error: `Erreur lors de la récupération des utilisateurs : ${err.message}`,
            layout: 'layouts/layout'
        });
    }
});

// Modifier un utilisateur
router.put('/:email', async (req, res) => {
    try {
        const user = await User.findOne({ email: req.params.email });
        if (!user) {
            return res.status(404).render('error', {
                error: 'Utilisateur non trouvé',
                layout: 'layouts/layout'
            });
        }

        user.username = req.body.username;
        user.email = req.body.email;

        if (req.body.password && req.body.password.trim() !== '') {
            const hashedPassword = await bcrypt.hash(req.body.password, 10);
            user.password = hashedPassword;
        }

        await user.save();
        req.flash('success', 'Utilisateur modifié avec succès');
        res.redirect('/users');
    } catch (err) {
        if (err.code === 11000) {
            return res.render('membres/usersForm', {
                user: { ...req.body },
                message: "Cet email est déjà utilisé",
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

// Suppression d'un utilisateur
router.delete('/:email', async (req, res) => {
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

// Route de connexion simplifiée
router.post('/login', async (req, res) => {
    try {
      const { email, password } = req.body;
      const user = await User.findOne({ email });
  
      if (!user || !(await user.isValidPassword(password))) {
        return res.status(401).render('home', {
          error: 'Email ou mot de passe incorrect',
          layout: false
        });
      }
  
      // Créer un token simple
      const token = jwt.sign(
        { _id: user._id, email: user.email, username: user.username },
        process.env.JWT_SECRET || 'secret',
        { expiresIn: '24h' }
      );
  
      // Envoyer le token dans un cookie
      res.cookie('token', token, {
        httpOnly: true,
        secure: false // passe à true si HTTPS en prod
      });
  
      req.flash('success', 'Connexion réussie');
      res.redirect('/dashboard');
    } catch (err) {
      res.status(500).render('home', {
        error: `Erreur lors de la connexion : ${err.message}`,
        layout: false
      });
    }
});

// Route de déconnexion simplifiée
router.all('/logout', (req, res) => {
    res.clearCookie('token');
    req.flash('success', 'Déconnexion réussie');
    res.redirect('/');
});  

module.exports = router;