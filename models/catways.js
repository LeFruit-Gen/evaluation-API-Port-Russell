const mongoose = require('mongoose');

const catwaySchema = new mongoose.Schema({
    catwayNumber: {
        type:       Number,
        required:   true,
        unique:     true,
    },
    catwayType: {
        type:       String,
        enum:       ['short', 'long'],
        required:   true,
    },
    catwayState: {
        type:       String,
        required:   true,
        trim:       true,
        maxlength:  100
    }
});

// Créer le modèle Catway à partir du schéma
const Catway = mongoose.model('Catway', catwaySchema);

module.exports = Catway;