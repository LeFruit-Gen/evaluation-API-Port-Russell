const express = require('express');
const router = express.Router({ mergeParams: true });
const Catway = require('../models/catways');
const Reservation = require('../models/reservations');
const User = require('../models/users');
const isAuthenticated = require('../middlewares/authMiddleware');

// GET /catways/:id/reservations - Liste des réservations d'un catway
router.get('/', isAuthenticated, async (req, res) => {
    try {
        const catway = await Catway.findOne({ catwayNumber: req.params.id });
        if (!catway) {
            return res.status(404).render('error', {
                error: 'Catway non trouvé',
                layout: 'layouts/layout'
            });
        }

        const reservations = await Reservation.find({ catwayNumber: req.params.id })
            .populate('user')
            .sort({ startDate: -1 });

        // Ajout du champ isOwner pour chaque réservation
        const reservationsWithOwnership = reservations.map(reservation => {
            const isOwner = req.user.role === 'admin' || 
                          (reservation.user && reservation.user._id && 
                           reservation.user._id.toString() === req.user._id.toString());
            return {
                ...reservation.toObject(),
                isOwner
            };
        });

        res.render('reservations/reservationsList', {
            catway,
            reservations: reservationsWithOwnership,
            message: req.flash('success'),
            error: req.flash('error'),
            isGlobalList: false,
            currentUser: req.user,
            layout: 'layouts/list'
        });
    } catch (err) {
        res.status(500).render('error', {
            error: err.message,
            layout: 'layouts/layout'
        });
    }
});

// GET /catways/:id/reservations/new - Formulaire de création
router.get('/new', isAuthenticated, async (req, res) => {
    try {
        const catway = await Catway.findOne({ catwayNumber: req.params.id });
        if (!catway) {
            return res.status(404).render('error', {
                error: 'Catway non trouvé',
                layout: 'layouts/layout'
            });
        }

        res.render('reservations/reservationsForm', {
            catway,
            reservation: null,
            isEditing: false,
            error: null,
            user: req.user,
            layout: 'layouts/layout'
        });
    } catch (err) {
        res.status(500).render('error', {
            error: err.message,
            layout: 'layouts/layout'
        });
    }
});

// GET /catways/:id/reservations/:idReservation/edit - Formulaire d'édition
router.get('/:idReservation/edit', isAuthenticated, async (req, res) => {
    try {
        const catway = await Catway.findOne({ catwayNumber: req.params.id });
        if (!catway) {
            return res.status(404).render('error', {
                error: 'Catway non trouvé',
                layout: 'layouts/layout'
            });
        }

        const reservation = await Reservation.findById(req.params.idReservation);
        if (!reservation) {
            return res.status(404).render('error', {
                error: 'Réservation non trouvée',
                layout: 'layouts/layout'
            });
        }

        // Vérifier que l'utilisateur est autorisé
        if (req.user.role !== 'admin' && (!reservation.user || reservation.user.toString() !== req.user._id.toString())) {
            return res.status(403).render('error', {
                error: 'Non autorisé',
                layout: 'layouts/layout'
            });
        }

        res.render('reservations/reservationsForm', {
            catway,
            reservation,
            isEditing: true,
            error: null,
            user: req.user,
            layout: 'layouts/layout'
        });
    } catch (err) {
        res.status(500).render('error', {
            error: err.message,
            layout: 'layouts/layout'
        });
    }
});

// GET /reservations/all - Liste globale des réservations (admin)
router.get('/all', isAuthenticated, async (req, res) => {
    try {
        const reservations = await Reservation.find()
            .sort({ startDate: -1 });

        // Vérifier les catways existants pour chaque réservation
        const reservationsWithStatus = await Promise.all(reservations.map(async (reservation) => {
            const catway = await Catway.findOne({ catwayNumber: reservation.catwayNumber });
            return {
                ...reservation.toObject(),
                catwayExists: !!catway
            };
        }));
        
        res.render('reservations/allReservations', {
            reservations: reservationsWithStatus,
            message: req.flash('success'),
            error: req.flash('error'),
            currentUser: req.user,
            layout: 'layouts/list'
        });
    } catch (err) {
        res.status(500).render('error', {
            error: err.message,
            layout: 'layouts/layout'
        });
    }
});

// POST /catways/:id/reservations - Créer une réservation
router.post('/', isAuthenticated, async (req, res) => {
    try {
        const catway = await Catway.findOne({ catwayNumber: req.params.id });
        if (!catway) {
            return res.status(404).render('error', {
                error: 'Catway non trouvé',
                layout: 'layouts/layout'
            });
        }

        const { startDate, endDate, boatName } = req.body;

        // Vérifier les conflits de réservation
        const conflictingReservation = await Reservation.findOne({
            catwayNumber: req.params.id,
            $or: [
                {
                    startDate: { $lte: endDate },
                    endDate: { $gte: startDate }
                }
            ]
        });

        if (conflictingReservation) {
            return res.status(400).render('reservations/reservationsForm', {
                catway,
                reservation: req.body,
                isEditing: false,
                error: 'Cette période est déjà réservée',
                user: req.user,
                layout: 'layouts/layout'
            });
        }

        const reservation = new Reservation({
            startDate,
            endDate,
            boatName,
            catwayNumber: req.params.id,
            clientName: req.user.username,
            user: req.user._id
        });

        await reservation.save();
        
        const returnTo = req.query.returnTo;
        if (returnTo === 'dashboard') {
            req.flash('success', 'Réservation créée avec succès');
            res.redirect('/dashboard');
        } else {
            req.flash('success', 'Réservation créée avec succès');
            res.redirect(`/catways/${catway.catwayNumber}/reservations`);
        }
    } catch (err) {
        res.status(400).render('reservations/reservationsForm', {
            catway,
            reservation: req.body,
            isEditing: false,
            error: err.message,
            user: req.user,
            layout: 'layouts/layout'
        });
    }
});

// PUT /catways/:id/reservations/:idReservation - Modifier une réservation
router.put('/:idReservation', isAuthenticated, async (req, res) => {
    try {
        const catway = await Catway.findOne({ catwayNumber: req.params.id });
        if (!catway) {
            return res.status(404).render('error', {
                error: 'Catway non trouvé',
                layout: 'layouts/layout'
            });
        }

        const reservation = await Reservation.findById(req.params.idReservation);
        if (!reservation) {
            return res.status(404).render('error', {
                error: 'Réservation non trouvée',
                layout: 'layouts/layout'
            });
        }

        // Vérifier que l'utilisateur est autorisé
        if (req.user.role !== 'admin' && (!reservation.user || reservation.user.toString() !== req.user._id.toString())) {
            return res.status(403).render('error', {
                error: 'Non autorisé',
                layout: 'layouts/layout'
            });
        }

        const { startDate, endDate, boatName, clientName } = req.body;

        // Vérifier les conflits de réservation
        const conflictingReservation = await Reservation.findOne({
            _id: { $ne: req.params.idReservation },
            catwayNumber: req.params.id,
            $or: [
                {
                    startDate: { $lte: endDate },
                    endDate: { $gte: startDate }
                }
            ]
        });

        if (conflictingReservation) {
            return res.status(400).render('reservations/reservationsForm', {
                catway,
                reservation: { ...req.body, _id: req.params.idReservation },
                isEditing: true,
                error: 'Cette période est déjà réservée',
                user: req.user,
                layout: 'layouts/layout'
            });
        }

        const updateData = {
            startDate,
            endDate,
            boatName
        };

        // Si c'est un admin, permettre la modification du nom du client
        if (req.user.role === 'admin') {
            updateData.clientName = clientName;
        }

        await Reservation.findByIdAndUpdate(req.params.idReservation, updateData);
        
        const returnTo = req.query.returnTo;
        if (returnTo === 'dashboard') {
            req.flash('success', 'Réservation modifiée avec succès');
            res.redirect('/dashboard');
        } else {
            req.flash('success', 'Réservation modifiée avec succès');
            res.redirect(`/catways/${catway.catwayNumber}/reservations`);
        }
    } catch (err) {
        res.status(400).render('reservations/reservationsForm', {
            catway,
            reservation: { ...req.body, _id: req.params.idReservation },
            isEditing: true,
            error: err.message,
            user: req.user,
            layout: 'layouts/layout'
        });
    }
});

// DELETE /catways/:id/reservations/:idReservation - Supprimer une réservation
router.delete('/:idReservation', isAuthenticated, async (req, res) => {
    try {
        const reservation = await Reservation.findById(req.params.idReservation);
        if (!reservation) {
            req.flash('error', 'Réservation non trouvée');
            return res.redirect(`/catways/${req.params.id}/reservations`);
        }

        // Vérifier que l'utilisateur est autorisé
        if (req.user.role !== 'admin' && (!reservation.user || reservation.user.toString() !== req.user._id.toString())) {
            req.flash('error', 'Non autorisé');
            return res.redirect(`/catways/${req.params.id}/reservations`);
        }

        await Reservation.findByIdAndDelete(req.params.idReservation);
        
        const returnTo = req.query.returnTo;
        if (returnTo === 'dashboard') {
            req.flash('success', 'Réservation supprimée avec succès');
            res.redirect('/dashboard');
        } else {
            req.flash('success', 'Réservation supprimée avec succès');
            res.redirect(`/catways/${req.params.id}/reservations`);
        }
    } catch (err) {
        req.flash('error', err.message);
        res.redirect(`/catways/${req.params.id}/reservations`);
    }
});

module.exports = router;