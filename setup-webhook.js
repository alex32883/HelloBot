const axios = require('axios');
require('dotenv').config();

const token = process.env.BOT_TOKEN;
const webhookUrl = process.env.WEBHOOK_URL || process.argv[2];

if (!token) {
  console.error('Ошибка: не задан BOT_TOKEN в файле .env');
  process.exit(1);
}

if (!webhookUrl) {
  console.error('Ошибка: не указан URL webhook.');
  console.error('Использование: node setup-webhook.js <URL>');
  console.error('Или установите переменную WEBHOOK_URL в .env');
  console.error('Пример: https://your-bot.vercel.app/api/bot');
  process.exit(1);
}

console.log('Настройка webhook...');
console.log(`URL: ${webhookUrl}`);

axios.post(`https://api.telegram.org/bot${token}/setWebhook`, {
  url: webhookUrl
}).then(response => {
  console.log('✅ Webhook успешно установлен!');
  console.log('Ответ:', JSON.stringify(response.data, null, 2));
  
  // Проверяем информацию о webhook
  return axios.get(`https://api.telegram.org/bot${token}/getWebhookInfo`);
}).then(response => {
  console.log('\n📋 Информация о webhook:');
  console.log(JSON.stringify(response.data, null, 2));
}).catch(error => {
  console.error('❌ Ошибка при настройке webhook:');
  if (error.response) {
    console.error('Статус:', error.response.status);
    console.error('Данные:', JSON.stringify(error.response.data, null, 2));
  } else {
    console.error('Сообщение:', error.message);
  }
  process.exit(1);
});
