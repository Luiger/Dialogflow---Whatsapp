const axios = require('axios');

const { TELEGRAM_API_KEY } = require('./constant');

const sendMessage = async (chatId, text) => {
    const response = await axios.post(`https://graph.facebook.com/v21.0/${TELEGRAM_API_KEY}/subscribed_apps`, {
        chat_id: chatId,
        text: text,
    });
    console.log(response.data);
};

module.exports = {
    sendMessage
};
