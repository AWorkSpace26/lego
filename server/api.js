const cors = require('cors'); 
const express = require('express');
const helmet = require('helmet');
const { findDealById } = require('./db'); // Import de la fonction

const PORT = 8092;
const app = express();

module.exports = app;

app.use(require('body-parser').json());
app.use(cors());
app.use(helmet());

app.options('*', cors());

app.get('/', (req, res) => {
  res.send({'ack': true});
});

// ✅ Endpoint pour récupérer un deal par ID
app.get('/deals/:id', async (req, res) => {
    const dealId = req.params.id;

    try {
        const deal = await findDealById(dealId); // Recherche dans MongoDB
        
        if (!deal) {
            return res.status(404).json({ error: 'Deal not found' });
        }

        res.json(deal);
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.listen(PORT, () => {
    console.log(`📡 Running on port ${PORT}`);
});
