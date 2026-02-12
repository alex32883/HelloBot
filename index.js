require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');

const token = process.env.BOT_TOKEN;

if (!token) {
  console.error('Ошибка: не задан BOT_TOKEN в файле .env');
  process.exit(1);
}

// Создаём бота в режиме long polling
const bot = new TelegramBot(token, { polling: true });

const greetings = [
  'Привет, я бот!',
  'Здравствуйте, я бот!',
  'Добрый день, я бот!'
];

bot.on('message', (msg) => {
  const chatId = msg.chat.id;
  const randomGreeting = greetings[Math.floor(Math.random() * greetings.length)];
  bot.sendMessage(chatId, randomGreeting);
});

console.log('Бот запущен и ожидает сообщений...');

