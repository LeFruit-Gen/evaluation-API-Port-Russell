const mongoose = require('mongoose');

const reservationSchema = new mongoose.Schema({
    catwayNumber: {
        type: Number,
        required: [true, 'Le numéro de catway est requis']
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: false
    },
    clientName: {
        type: String,
        required: [true, 'Le nom du client est requis'],
        trim: true,
        minlength: [2, 'Le nom doit contenir au moins 2 caractères'],
        maxlength: [100, 'Le nom ne peut pas dépasser 100 caractères']
    },
    boatName: {
        type: String,
        required: [true, 'Le nom du bateau est requis'],
        trim: true,
        minlength: [2, 'Le nom du bateau doit contenir au moins 2 caractères'],
        maxlength: [100, 'Le nom du bateau ne peut pas dépasser 100 caractères']
    },
    startDate: {
        type: Date,
        required: [true, 'La date de début est requise'],
        validate: {
            validator: function(date) {
                const now = new Date();
                now.setHours(0, 0, 0, 0);
                return date >= now;
            },
            message: 'La date de début doit être aujourd\'hui ou dans le futur'
        }
    },
    endDate: {
        type: Date,
        required: [true, 'La date de fin est requise'],
        validate: {
            validator: function(date) {
                return date > this.startDate;
            },
            message: 'La date de fin doit être après la date de début'
        }
    },
    status: {
        type: String,
        enum: ['terminée', 'en-cours', 'à-venir'],
        default: 'à-venir'
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Middleware pre-save pour définir le statut automatiquement
reservationSchema.pre('save', function(next) {
    const now = new Date();
    if (this.endDate < now) {
        this.status = 'terminée';
    } else if (this.startDate <= now && this.endDate >= now) {
        this.status = 'en-cours';
    } else {
        this.status = 'à-venir';
    }
    next();
});

// Index pour optimiser les recherches
reservationSchema.index({ catwayNumber: 1, startDate: 1, endDate: 1 });
reservationSchema.index({ user: 1 });

// Virtual pour calculer la durée de la réservation en jours
reservationSchema.virtual('duration').get(function() {
    return Math.ceil((this.endDate - this.startDate) / (1000 * 60 * 60 * 24));
});

const Reservation = mongoose.model('Reservation', reservationSchema);

module.exports = Reservation;