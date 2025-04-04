const express = require('express');
const router = express.Router();
const Catway = require('../models/catways');
const Reservation = require('../models/reservations');

// GET /catways - Liste des catways
router.get("/", async (req, res) => {
    try {
        const catways = await Catway.find().sort('catwayNumber');
        res.render('catways/catwaysList', { 
            catways,
            message: req.flash('success'),
            error: req.flash('error'),
            layout: 'layouts/layout'
        });
    } catch (err) {
        res.status(400).render('error', { 
            error: `Erreur lors de la récupération des catways : ${err.message}`,
            layout: 'layouts/layout'
        });
    }
});

// GET /catways/new - Formulaire de création
router.get("/new", (req, res) => {
    res.render('catways/catwaysForm', { 
        catway: null,
        isEditing: false,
        error: null,
        layout: 'layouts/layout'
    });
});

// POST /catways - Création d'un catway
router.post("/", async (req, res) => {
    try {
        const { catwayNumber, catwayType, catwayState } = req.body;
        
        const existingCatway = await Catway.findOne({ catwayNumber });
        if (existingCatway) {
            return res.status(409).render('catways/catwaysForm', {
                catway: req.body,
                isEditing: false,
                error: `Le catway numéro ${req.body.catwayNumber} existe déjà`,
                layout: 'layouts/layout'
            });
        }

        const newCatway = new Catway({ catwayNumber, catwayType, catwayState });
        await newCatway.save();
        req.flash('success', 'Catway créé avec succès');
        res.redirect('/catways');
    } catch (err) {
        res.status(400).render('catways/catwaysForm', {
            catway: req.body,
            isEditing: false,
            error: `Erreur lors de la création du catway : ${err.message}`,
            layout: 'layouts/layout'
        });
    }
});

// GET /catways/:id - Détails d'un catway
router.get("/:id", async (req, res) => {
    try {
        const catway = await Catway.findOne({ catwayNumber: req.params.id });
        if (!catway) {
            return res.status(404).render('error', { 
                error: 'Catway non trouvé',
                layout: 'layouts/layout'
            });
        }
        
        res.render('catways/catwaysDetail', { 
            catway,
            message: req.flash('success'),
            layout: 'layouts/layout'
        });
    } catch (err) {
        res.status(400).render('error', { 
            error: `Erreur lors de la récupération du catway : ${err.message}`,
            layout: 'layouts/layout'
        });
    }
});

// GET /catways/:id/edit - Formulaire de modification
router.get("/:id/edit", async (req, res) => {
    try {
        const catway = await Catway.findOne({ catwayNumber: req.params.id });
        if (!catway) {
            return res.status(404).render('error', {
                error: 'Catway non trouvé',
                layout: 'layouts/layout'
            });
        }
        res.render('catways/catwaysForm', {
            catway,
            isEditing: true,
            error: null,
            layout: 'layouts/layout'
        });
    } catch (err) {
        res.status(400).render('error', {
            error: `Erreur lors de la récupération du catway : ${err.message}`,
            layout: 'layouts/layout'
        });
    }
});

// PUT /catways/:id - Modification d'un catway
router.put("/:id", async (req, res) => {
    try {
        const { catwayType, catwayState } = req.body;
        const catway = await Catway.findOne({ catwayNumber: req.params.id });
        
        if (!catway) {
            return res.status(404).render('error', {
                error: 'Catway non trouvé',
                layout: 'layouts/layout'
            });
        }

        catway.catwayState = catwayState;
        await catway.save();

        req.flash('success', 'Catway modifié avec succès');
        res.redirect('/catways');
    } catch (err) {
        res.status(400).render('catways/catwaysForm', {
            catway: { ...req.body, catwayNumber: req.params.id },
            isEditing: true,
            error: `Erreur lors de la modification du catway : ${err.message}`,
            layout: 'layouts/layout'
        });
    }
});

// DELETE /catways/:id - Suppression d'un catway
router.delete("/:id", async (req, res) => {
    try {
        const activeReservations = await Reservation.find({
            catwayNumber: req.params.id,
            endDate: { $gte: new Date() }
        });

        if (activeReservations.length > 0) {
            req.flash('error', 'Impossible de supprimer un catway ayant des réservations actives');
            return res.redirect('/catways');
        }

        await Reservation.deleteMany({ catwayNumber: req.params.id });

        const catway = await Catway.findOneAndDelete({ catwayNumber: req.params.id });
        if (!catway) {
            return res.status(404).render('error', {
                error: 'Catway non trouvé',
                layout: 'layouts/layout'
            });
        }

        req.flash('success', 'Catway et ses réservations supprimés avec succès');
        res.redirect('/catways');
    } catch (err) {
        req.flash('error', 'Erreur lors de la suppression du catway');
        res.redirect('/catways');
    }
});

module.exports = router;