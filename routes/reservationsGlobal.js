const express = require('express');
const router = express.Router();
const Reservation = require('../models/reservations');
const Catway = require('../models/catways');
const isAuthenticated = require('../middlewares/authMiddleware');

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
        res.status(400).render('error', {
            error: `Erreur lors de la récupération des réservations : ${err.message}`,
            layout: 'layouts/layout'
        });
    }
});

// GET /reservations/my - Liste des réservations de l'utilisateur
router.get('/my', isAuthenticated, async (req, res) => {
    try {
        const reservations = await Reservation.find({ userId: req.user.id })
            .sort({ startDate: -1 });

        // Vérifier les catways existants pour chaque réservation
        const reservationsWithStatus = await Promise.all(reservations.map(async (reservation) => {
            const catway = await Catway.findOne({ catwayNumber: reservation.catwayNumber });
            return {
                ...reservation.toObject(),
                catwayExists: !!catway
            };
        }));
        
        res.render('reservations/reservationsList', {
            reservations: reservationsWithStatus,
            message: req.flash('success'),
            error: req.flash('error'),
            currentUser: req.user,
            layout: 'layouts/list'
        });
    } catch (err) {
        res.status(400).render('error', {
            error: `Erreur lors de la récupération de vos réservations : ${err.message}`,
            layout: 'layouts/layout'
        });
    }
});

// GET /reservations/:id/edit - Formulaire de modification d'une réservation
router.get('/:id/edit', isAuthenticated, async (req, res) => {
    try {
        const reservation = await Reservation.findById(req.params.id).populate('user');
        if (!reservation) {
            req.flash('error', 'Réservation non trouvée');
            return res.redirect('/dashboard');
        }

        // Vérifier les permissions
        if (req.user.role !== 'admin' && req.user._id.toString() !== reservation.user._id.toString()) {
            req.flash('error', 'Vous n\'avez pas les droits pour modifier cette réservation');
            return res.redirect('/dashboard');
        }

        const catway = await Catway.findOne({ catwayNumber: reservation.catwayNumber });
        if (!catway) {
            req.flash('error', 'Le catway associé n\'existe plus');
            return res.redirect('/dashboard');
        }

        res.render('reservations/reservationsForm', {
            reservation,
            catway,
            isEditing: true,
            error: req.flash('error'),
            currentUser: req.user,
            layout: 'layouts/layout'
        });
    } catch (err) {
        req.flash('error', `Erreur lors du chargement du formulaire de modification : ${err.message}`);
        res.redirect('/dashboard');
    }
});

// PUT /reservations/:id - Mettre à jour une réservation
router.put('/:id', isAuthenticated, async (req, res) => {
    try {
        const reservation = await Reservation.findById(req.params.id).populate('user');
        if (!reservation) {
            req.flash('error', 'Réservation non trouvée');
            return res.redirect('/dashboard');
        }

        // Vérifier les permissions
        if (req.user.role !== 'admin' && req.user._id.toString() !== reservation.user._id.toString()) {
            req.flash('error', 'Vous n\'avez pas les droits pour modifier cette réservation');
            return res.redirect('/dashboard');
        }

        const { startDate, endDate, boatName, clientName } = req.body;

        // Vérifier les conflits de réservation (en excluant la réservation actuelle)
        const conflictingReservation = await Reservation.findOne({
            _id: { $ne: req.params.id },
            catwayNumber: reservation.catwayNumber,
            $or: [
                {
                    startDate: { $lte: endDate },
                    endDate: { $gte: startDate }
                }
            ]
        });

        if (conflictingReservation) {
            const catway = await Catway.findOne({ catwayNumber: reservation.catwayNumber });
            return res.status(400).render('reservations/reservationsForm', {
                reservation: { ...reservation.toObject(), ...req.body },
                catway,
                isEditing: true,
                error: 'Cette période est déjà réservée',
                currentUser: req.user,
                layout: 'layouts/layout'
            });
        }

        // Mettre à jour la réservation
        reservation.startDate = startDate;
        reservation.endDate = endDate;
        reservation.boatName = boatName;
        reservation.clientName = clientName;

        await reservation.save();
        req.flash('success', 'Réservation modifiée avec succès');
        res.redirect(`/catways/${reservation.catwayNumber}/reservations`);
    } catch (err) {
        const catway = await Catway.findOne({ catwayNumber: reservation.catwayNumber });
        res.status(400).render('reservations/reservationsForm', {
            reservation: { ...reservation.toObject(), ...req.body },
            catway,
            isEditing: true,
            error: `Erreur lors de la modification de la réservation : ${err.message}`,
            currentUser: req.user,
            layout: 'layouts/layout'
        });
    }
});

// DELETE /reservations/:id - Supprimer une réservation
router.delete('/:id', isAuthenticated, async (req, res) => {
    try {
        const reservation = await Reservation.findById(req.params.id);
        if (!reservation) {
            req.flash('error', 'Réservation non trouvée');
            return res.redirect('/dashboard');
        }

        // Vérifier que l'utilisateur est autorisé (admin ou propriétaire)
        if (req.user.role !== 'admin' && reservation.user.toString() !== req.user._id.toString()) {
            req.flash('error', 'Vous n\'avez pas les droits pour supprimer cette réservation');
            return res.redirect('/dashboard');
        }

        await Reservation.findByIdAndDelete(req.params.id);
        req.flash('success', 'Réservation supprimée avec succès');
        res.redirect('/reservations/all');
    } catch (err) {
        req.flash('error', `Erreur lors de la suppression de la réservation : ${err.message}`);
        res.redirect('/dashboard');
    }
});

module.exports = router;
