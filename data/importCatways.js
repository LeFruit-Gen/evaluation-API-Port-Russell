require('dotenv').config({ path: './.env/.env' });

const mongoose = require('mongoose');
const fs = require('fs').promises;
const Catway = require('../models/catways');

async function validateCatwayData(catway) {
    if (!catway.catwayNumber || typeof catway.catwayNumber !== 'number') {
        throw new Error(`Numéro de catway invalide: ${JSON.stringify(catway)}`);
    }
    if (!['disponible', 'occupé', 'maintenance'].includes(catway.catwayState)) {
        throw new Error(`État de catway invalide pour le catway ${catway.catwayNumber}`);
    }
    if (!['small', 'medium', 'large'].includes(catway.catwayType)) {
        throw new Error(`Type de catway invalide pour le catway ${catway.catwayNumber}`);
    }
}

async function importCatways() {
    try {
        await mongoose.connect(process.env.URL_MONGO, { 
            useNewUrlParser: true, 
            useUnifiedTopology: true 
        });
        console.log('Connexion à MongoDB réussie');

        const data = await fs.readFile('./data/catwaysData.json', 'utf8');
        const catwaysData = JSON.parse(data);

        console.log('Validation des données...');
        for (const catway of catwaysData) {
            await validateCatwayData(catway);
        }

        console.log('Nettoyage de la base de données...');
        await Catway.deleteMany({});

        console.log('Import des catways...');
        const result = await Catway.insertMany(catwaysData);
        console.log(`${result.length} catways importés avec succès`);

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

importCatways();