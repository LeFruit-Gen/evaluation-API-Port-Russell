const express = require('express');
const router = express.Router();
const Reservation = require('../models/reservations');
const Catway = require('../models/catways');

// GET /reservations/all - Liste globale des réservations
router.get('/all', async (req, res) => {
    try {
        const reservations = await Reservation.find().sort({ startDate: -1 });

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
            layout: 'layouts/layout'
        });
    } catch (err) {
        res.status(400).render('error', {
            error: `Erreur lors de la récupération des réservations : ${err.message}`,
            layout: 'layouts/layout'
        });
    }
});

// GET /reservations/my - Liste des réservations (on garde juste la route)
router.get('/my', async (req, res) => {
    try {
        const reservations = await Reservation.find().sort({ startDate: -1 });

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
            layout: 'layouts/layout'
        });
    } catch (err) {
        res.status(400).render('error', {
            error: `Erreur lors de la récupération de vos réservations : ${err.message}`,
            layout: 'layouts/layout'
        });
    }
});

// GET /reservations/:id/edit
router.get('/:id/edit', async (req, res) => {
    try {
        const reservation = await Reservation.findById(req.params.id);
        const catway = await Catway.findOne({ catwayNumber: reservation.catwayNumber });

        if (!reservation || !catway) {
            req.flash('error', 'Catway ou réservation non trouvée');
            return res.redirect('/dashboard');
        }

        res.render('reservations/reservationsForm', {
            reservation,
            catway,
            isEditing: true,
            error: req.flash('error'),
            layout: 'layouts/layout'
        });
    } catch (err) {
        req.flash('error', `Erreur lors du chargement du formulaire : ${err.message}`);
        res.redirect('/dashboard');
    }
});

// PUT /reservations/:id
router.put('/:id', async (req, res) => {
    try {
        const reservation = await Reservation.findById(req.params.id);
        const catway = await Catway.findOne({ catwayNumber: reservation.catwayNumber });

        if (!reservation || !catway) {
            req.flash('error', 'Catway ou réservation non trouvée');
            return res.redirect('/dashboard');
        }

        const { startDate, endDate, boatName, clientName } = req.body;

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
            return res.status(400).render('reservations/reservationsForm', {
                reservation: { ...reservation.toObject(), ...req.body },
                catway,
                isEditing: true,
                error: 'Cette période est déjà réservée',
                layout: 'layouts/layout'
            });
        }

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
            error: `Erreur lors de la modification : ${err.message}`,
            layout: 'layouts/layout'
        });
    }
});

// DELETE /reservations/:id
router.delete('/:id', async (req, res) => {
    try {
        const reservation = await Reservation.findById(req.params.id);
        if (!reservation) {
            req.flash('error', 'Réservation non trouvée');
            return res.redirect('/dashboard');
        }

        await Reservation.findByIdAndDelete(req.params.id);
        req.flash('success', 'Réservation supprimée avec succès');
        res.redirect('/reservations/all');
    } catch (err) {
        req.flash('error', `Erreur lors de la suppression : ${err.message}`);
        res.redirect('/dashboard');
    }
});

module.exports = router;