const axios = require('axios');

const { WHATSAPP_ID } = require('./constant');

const sendMessage = async (chatId, text) => {
    const response = await axios.post(`https://graph.facebook.com/v21.0/${WHATSAPP_ID}/subscribed_apps`, {
        chat_id: chatId,
        text: text,
    });
    console.log(response.data);
};

module.exports = {
    sendMessage
};
