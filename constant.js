require('dotenv').config();

const SERVICE_ACCOUNT_JSON_FILE_PATH = process.env.SERVICE_ACCOUNT_JSON_FILE_PATH;
const DIALOGFLOW_CX_AGENT_ID = process.env.DIALOGFLOW_CX_AGENT_ID;
const DIALOGFLOW_CX_AGENT_LOCATION = process.env.DIALOGFLOW_CX_AGENT_LOCATION;
const ERROR_MESSAGE = process.env.ERROR_MESSAGE;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const WHATSAPP_API_KEY = process.env.WHATSAPP_API_KEY;
const WHATSAPP_ID = process.env.WHATSAPP_ID;
const PORT = process.env.PORT;
const WEBHOOK_VERIFY_TOKEN = process.env.WEBHOOK_VERIFY_TOKEN;
const APP_SECRET = process.env.APP_SECRET;

module.exports = {
    SERVICE_ACCOUNT_JSON_FILE_PATH,
    DIALOGFLOW_CX_AGENT_ID,
    DIALOGFLOW_CX_AGENT_LOCATION,
    ERROR_MESSAGE,
    GEMINI_API_KEY,
    WHATSAPP_API_KEY,
    WHATSAPP_ID,
    PORT,
    WEBHOOK_VERIFY_TOKEN,
    APP_SECRET
};
