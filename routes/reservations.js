const express = require('express');
const router = express.Router({ mergeParams: true });
const Catway = require('../models/catways');
const Reservation = require('../models/reservations');

// GET /catways/:id/reservations
router.get('/', async (req, res) => {
    try {
        const catway = await Catway.findOne({ catwayNumber: req.params.id });
        if (!catway) {
            return res.status(404).render('error', {
                error: 'Catway non trouvé',
                layout: 'layouts/layout'
            });
        }

        const reservations = await Reservation.find({ catwayNumber: req.params.id })
            .sort({ startDate: -1 });

        res.render('reservations/reservationsList', {
            catway,
            reservations,
            message: req.flash('success'),
            error: req.flash('error'),
            isGlobalList: false,
            layout: 'layouts/layout'
        });
    } catch (err) {
        res.status(500).render('error', {
            error: err.message,
            layout: 'layouts/layout'
        });
    }
});

// GET /catways/:id/reservations/new
router.get('/new', async (req, res) => {
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
            layout: 'layouts/layout'
        });
    } catch (err) {
        res.status(500).render('error', {
            error: err.message,
            layout: 'layouts/layout'
        });
    }
});

// GET /catways/:id/reservations/:idReservation/edit
router.get('/:idReservation/edit', async (req, res) => {
    try {
        const catway = await Catway.findOne({ catwayNumber: req.params.id });
        const reservation = await Reservation.findById(req.params.idReservation);
        if (!catway || !reservation) {
            return res.status(404).render('error', {
                error: 'Catway ou réservation non trouvée',
                layout: 'layouts/layout'
            });
        }

        res.render('reservations/reservationsForm', {
            catway,
            reservation,
            isEditing: true,
            error: null,
            layout: 'layouts/layout'
        });
    } catch (err) {
        res.status(500).render('error', {
            error: err.message,
            layout: 'layouts/layout'
        });
    }
});

// GET /reservations/all
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
        res.status(500).render('error', {
            error: err.message,
            layout: 'layouts/layout'
        });
    }
});

// POST /catways/:id/reservations
router.post('/', async (req, res) => {
    try {
        const catway = await Catway.findOne({ catwayNumber: req.params.id });
        if (!catway) {
            return res.status(404).render('error', {
                error: 'Catway non trouvé',
                layout: 'layouts/layout'
            });
        }

        const { startDate, endDate, boatName, clientName } = req.body;

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
                layout: 'layouts/layout'
            });
        }

        const reservation = new Reservation({
            startDate,
            endDate,
            boatName,
            catwayNumber: req.params.id,
            clientName
        });

        await reservation.save();

        req.flash('success', 'Réservation créée avec succès');
        res.redirect(`/catways/${catway.catwayNumber}/reservations`);
    } catch (err) {
        res.status(400).render('reservations/reservationsForm', {
            catway,
            reservation: req.body,
            isEditing: false,
            error: err.message,
            layout: 'layouts/layout'
        });
    }
});

// PUT /catways/:id/reservations/:idReservation
router.put('/:idReservation', async (req, res) => {
    try {
        const catway = await Catway.findOne({ catwayNumber: req.params.id });
        const reservation = await Reservation.findById(req.params.idReservation);
        if (!catway || !reservation) {
            return res.status(404).render('error', {
                error: 'Catway ou réservation non trouvée',
                layout: 'layouts/layout'
            });
        }

        const { startDate, endDate, boatName, clientName } = req.body;

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
                layout: 'layouts/layout'
            });
        }

        await Reservation.findByIdAndUpdate(req.params.idReservation, {
            startDate,
            endDate,
            boatName,
            clientName
        });

        req.flash('success', 'Réservation modifiée avec succès');
        res.redirect(`/catways/${catway.catwayNumber}/reservations`);
    } catch (err) {
        res.status(400).render('reservations/reservationsForm', {
            catway,
            reservation: { ...req.body, _id: req.params.idReservation },
            isEditing: true,
            error: err.message,
            layout: 'layouts/layout'
        });
    }
});

// DELETE /catways/:id/reservations/:idReservation
router.delete('/:idReservation', async (req, res) => {
    try {
        const reservation = await Reservation.findById(req.params.idReservation);
        if (!reservation) {
            req.flash('error', 'Réservation non trouvée');
            return res.redirect(`/catways/${req.params.id}/reservations`);
        }

        await Reservation.findByIdAndDelete(req.params.idReservation);

        req.flash('success', 'Réservation supprimée avec succès');
        res.redirect(`/catways/${req.params.id}/reservations`);
    } catch (err) {
        req.flash('error', err.message);
        res.redirect(`/catways/${req.params.id}/reservations`);
    }
});

module.exports = router;