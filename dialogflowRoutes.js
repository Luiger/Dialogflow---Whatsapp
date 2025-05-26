
import { Router } from 'express';
const router = Router();
import { handleWebhookVerification, handleIncomingMessage } from '/dialogflowController';

// Ruta para la verificación del Webhook de WhatsApp (GET)
router.get('/webhook', handleWebhookVerification);

// Ruta para recibir mensajes de WhatsApp (POST)
router.post('/webhook', handleIncomingMessage);

export default router;