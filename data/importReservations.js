const mongoose = require('mongoose');
const fs = require('fs').promises;
require('dotenv').config({ path: './.env/.env' });
const Reservation = require('../models/reservations');

async function validateReservationData(reservation) {
    if (!reservation.catwayNumber || typeof reservation.catwayNumber !== 'number') {
        throw new Error(`Numéro de catway invalide: ${JSON.stringify(reservation)}`);
    }
    if (!reservation.clientName || typeof reservation.clientName !== 'string') {
        throw new Error(`Nom du client invalide pour la réservation du catway ${reservation.catwayNumber}`);
    }
    if (!reservation.boatName || typeof reservation.boatName !== 'string') {
        throw new Error(`Nom du bateau invalide pour la réservation du catway ${reservation.catwayNumber}`);
    }

    const startDate = new Date(reservation.startDate);
    const endDate = new Date(reservation.endDate);
    
    if (isNaN(startDate.getTime())) {
        throw new Error(`Date de début invalide pour la réservation du catway ${reservation.catwayNumber}`);
    }
    if (isNaN(endDate.getTime())) {
        throw new Error(`Date de fin invalide pour la réservation du catway ${reservation.catwayNumber}`);
    }
    if (endDate <= startDate) {
        throw new Error(`La date de fin doit être après la date de début pour le catway ${reservation.catwayNumber}`);
    }
}

async function importReservations() {
    try {
        await mongoose.connect(process.env.URL_MONGO, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log('Connexion à MongoDB réussie');

        const data = await fs.readFile('./data/reservationsData.json', 'utf8');
        const reservationsData = JSON.parse(data);

        console.log('Validation des données...');
        for (const reservation of reservationsData) {
            await validateReservationData(reservation);
        }

        console.log('Nettoyage de la base de données...');
        await Reservation.deleteMany({});

        console.log('Import des réservations...');
        const result = await Reservation.insertMany(reservationsData);
        console.log(`${result.length} réservations importées avec succès`);

    } catch (err) {
        console.error('Erreur lors de l\'import :', err.message);
        process.exit(1);
    } finally {
        if (mongoose.connection.readyState === 1) {
            await mongoose.connection.close();
            console.log('Connexion MongoDB fermée');
        }
        process.exit(0);
    }
}

importReservations();
