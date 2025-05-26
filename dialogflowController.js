// controllers/dialogflowController.js
const { SessionsClient } = require('@google-cloud/dialogflow-cx');
const axios = require('axios'); // Para enviar mensajes a la API de WhatsApp
const crypto = require('crypto'); // Para la verificación de la firma

const {
    SERVICE_ACCOUNT_JSON_FILE_PATH
} = require('./constant');
const credentials = JSON.parse(fs.readFileSync(SERVICE_ACCOUNT_JSON_FILE_PATH));


const projectId = credentials.project_id;
const locationId = process.env.DIALOGFLOW_CX_AGENT_LOCATION;
const agentId = process.env.DIALOGFLOW_CX_AGENT_ID;
const languageCode = 'es';
const whatsappToken = process.env.WHATSAPP_API_KEY; // Tu Access Token de Meta
const whatsappPhoneNumberId = process.env.WHATSAPP_ID; // ID del número de teléfono
const webhookVerifyToken = process.env.WEBHOOK_VERIFY_TOKEN; // Tu token de verificación
const appSecret = process.env.APP_SECRET; // El App Secret de tu app de Meta

const client = new SessionsClient({
    keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS
});

// Función para verificar la firma de las solicitudes POST de WhatsApp
function verifyWhatsappSignature(req) {
    const signature = req.headers['x-hub-signature-256'];
    if (!signature) {
        console.warn('Missing X-Hub-Signature-256 header');
        return false;
    }

    const signatureHash = signature.split('=')[1];
    const expectedHash = crypto
        .createHmac('sha256', appSecret)
        .update(req.rawBody) // Usar el rawBody
        .digest('hex');

    if (signatureHash !== expectedHash) {
        console.warn('Signature verification failed!');
        return false;
    }
    console.log('Signature verified successfully!');
    return true;
}


exports.handleWebhookVerification = (req, res) => {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    if (mode && token) {
        if (mode === 'subscribe' && token === webhookVerifyToken) {
            console.log('WEBHOOK_VERIFIED');
            res.status(200).send(challenge);
        } else {
            console.error('Failed webhook verification. Mode or token mismatch.');
            res.sendStatus(403);
        }
    } else {
        console.error('Missing mode or token in webhook verification request.');
        res.sendStatus(400);
    }
};

exports.handleIncomingMessage = async (req, res) => {
    console.log('Incoming WhatsApp message:', JSON.stringify(req.body, null, 2));

    // 1. Verificar la firma (¡MUY IMPORTANTE para seguridad!)
    //    Si estás usando express.json() sin rawBody, esta verificación puede fallar.
    //    Asegúrate de tener el rawBody como se configuró en index.js.
    if (!verifyWhatsappSignature(req)) {
         return res.sendStatus(403); // Forbidden si la firma no es válida
    }

    const body = req.body;

    // 2. Verificar que es un evento de mensaje de WhatsApp
    if (body.object === 'whatsapp_business_account') {
        body.entry.forEach(entry => {
            entry.changes.forEach(async change => {
                if (change.field === 'messages' && change.value.messages) {
                    change.value.messages.forEach(async message => {
                        if (message.type === 'text') {
                            const from = message.from; // Número del remitente
                            const text = message.text.body; // Texto del mensaje

                            console.log(`Message from ${from}: ${text}`);

                            try {
                                // 3. Enviar a Dialogflow CX (tu lógica actual puede ser similar)
                                const dialogflowResponse = await sendMessageToDialogflow(from, text); // 'from' puede ser tu session ID

                                // 4. Enviar respuesta de Dialogflow de vuelta a WhatsApp
                                if (dialogflowResponse) {
                                    await sendWhatsappMessage(from, dialogflowResponse);
                                }
                            } catch (error) {
                                console.error('Error processing message or sending to Dialogflow:', error);
                            }
                        }
                    });
                }
            });
        });
        res.sendStatus(200); // Responder a WhatsApp que recibiste el evento
    } else {
        // No es un evento de WhatsApp que nos interese
        res.sendStatus(404);
    }
};

// Función para enviar mensajes a Dialogflow CX (adaptada de tu código)
async function sendMessageToDialogflow(sessionId, text) {
    const sessionPath = client.projectLocationAgentSessionPath(
        projectId,
        locationId,
        agentId,
        sessionId // Usa el número de teléfono del usuario o un ID único para la sesión
    );

    const request = {
        session: sessionPath,
        queryInput: {
            text: {
                text: text,
            },
            languageCode: languageCode,
        },
    };

    try {
        const [response] = await client.detectIntent(request);
        console.log('Dialogflow CX Response:', JSON.stringify(response.queryResult, null, 2));
        let fullfillmentText = '';
        response.queryResult.responseMessages.forEach(message => {
            if (message.text) {
                fullfillmentText += message.text.text.join('\n') + '\n';
            }
        });
        return fullfillmentText.trim();
    } catch (error) {
        console.error('ERROR Dialogflow CX:', error.message);
        // Considera cómo manejar los errores de Dialogflow aquí
        // Podrías devolver un mensaje genérico de error o lanzar la excepción
        // para que handleIncomingMessage la capture.
        // Por ahora, devolvemos null para indicar un problema.
        return "Lo siento, tuve un problema para procesar tu solicitud con Dialogflow.";
    }
}


// NUEVA FUNCIÓN para enviar mensajes a WhatsApp
async function sendWhatsappMessage(to, text) {
    if (!text || text.trim() === "") {
        console.log("No hay texto para enviar a WhatsApp, omitiendo.");
        return;
    }
    console.log(`Sending message to ${to}: ${text}`);
    try {
        await axios.post(`https://graph.facebook.com/v19.0/${whatsappPhoneNumberId}/messages`, { // Asegúrate de usar una versión de API reciente
            messaging_product: 'whatsapp',
            to: to,
            type: 'text',
            text: {
                body: text
            }
        }, {
            headers: {
                'Authorization': `Bearer ${whatsappToken}`,
                'Content-Type': 'application/json'
            }
        });
        console.log('Message sent to WhatsApp successfully.');
    } catch (error) {
        console.error('Error sending message to WhatsApp:');
        if (error.response) {
            // La solicitud se realizó y el servidor respondió con un código de estado
            // que cae fuera del rango de 2xx
            console.error('Data:', error.response.data);
            console.error('Status:', error.response.status);
            console.error('Headers:', error.response.headers);
        } else if (error.request) {
            // La solicitud se realizó pero no se recibió respuesta
            console.error('Request:', error.request);
        } else {
            // Algo sucedió al configurar la solicitud que provocó un error
            console.error('Error', error.message);
        }
    }
}