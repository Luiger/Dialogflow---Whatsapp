// index.js
require('dotenv').config();
import express, { json } from 'express';
import bodyParser from 'body-parser'; // Ya lo tienes
import router from './rutasd.js';
import crypto from 'crypto'; // Para la verificación de la firma

const app = express();

// Middleware para parsear JSON. WhatsApp envía JSON.
// IMPORTANTE: Para la verificación de la firma, necesitas el raw body.
// bodyParser.json() puede interferir si no se configura correctamente.
// Meta recomienda leer el raw body para la firma.
app.use(json({
    verify: (req, res, buf) => {
        req.rawBody = buf.toString();
    }
}));

app.use('/api/dialogflow', router); // Tu ruta actual

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});