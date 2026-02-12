require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');

const token = process.env.BOT_TOKEN;
const weatherApiKey = process.env.WEATHER_API_KEY;

if (!token) {
  console.error('Ошибка: не задан BOT_TOKEN в файле .env');
}

// Создаём бота БЕЗ polling (для webhook)
const bot = new TelegramBot(token);

const greetings = [
  'Привет, я бот!',
  'Здравствуйте, я бот!',
  'Добрый день, я бот!'
];

// Небольшой список «мудростей дня»
const wisdoms = [
  'Каждый день — новый шанс стать лучше, чем вчера.',
  'Самый тёмный час — перед рассветом.',
  'Маленький шаг сегодня лучше, чем большое «завтра».',
  'Не бойся ошибок — бойся бездействия.',
  'Сила в том, чтобы начать, мудрость — чтобы продолжать.'
];

// Функция для получения погоды
async function getWeather(city = 'Montreal') {
  if (!weatherApiKey) {
    return 'Ошибка: не задан WEATHER_API_KEY в файле .env. Получите ключ на https://openweathermap.org/api';
  }

  try {
    const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${weatherApiKey}&units=metric&lang=ru`;
    const response = await axios.get(url);
    const data = response.data;

    const weatherEmoji = {
      'Clear': '☀️',
      'Clouds': '☁️',
      'Rain': '🌧️',
      'Drizzle': '🌦️',
      'Thunderstorm': '⛈️',
      'Snow': '❄️',
      'Mist': '🌫️',
      'Fog': '🌫️'
    };

    const emoji = weatherEmoji[data.weather[0].main] || '🌤️';
    const description = data.weather[0].description;
    const temp = Math.round(data.main.temp);
    const feelsLike = Math.round(data.main.feels_like);
    const humidity = data.main.humidity;
    const windSpeed = data.wind.speed;

    return `${emoji} Погода в ${data.name}:\n\n` +
           `🌡️ Температура: ${temp}°C (ощущается как ${feelsLike}°C)\n` +
           `☁️ ${description.charAt(0).toUpperCase() + description.slice(1)}\n` +
           `💧 Влажность: ${humidity}%\n` +
           `💨 Ветер: ${windSpeed} м/с`;
  } catch (error) {
    if (error.response && error.response.status === 404) {
      return `Город "${city}" не найден. Попробуйте указать другой город.`;
    }
    return 'Ошибка при получении данных о погоде. Попробуйте позже.';
  }
}

// Обработчик команды /start
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  const randomGreeting = greetings[Math.floor(Math.random() * greetings.length)];
  const randomWisdom = wisdoms[Math.floor(Math.random() * wisdoms.length)];
  
  const welcomeMessage = `${randomGreeting}\n\nМудрость дня: ${randomWisdom}\n\n` +
    `Я умею:\n` +
    `🌤️ Показывать погоду - напишите "погода" или используйте команды /weather или /погода\n` +
    `💬 Общаться - просто напишите мне что-нибудь!\n\n` +
    `Попробуйте написать "погода Москва" или "/weather London"`;
  
  bot.sendMessage(chatId, welcomeMessage);
});

// Обработчик команды /help
bot.onText(/\/help/, (msg) => {
  const chatId = msg.chat.id;
  const helpMessage = `📋 Доступные команды:\n\n` +
    `/start - Начать работу с ботом\n` +
    `/help - Показать эту справку\n` +
    `/weather [город] - Погода в указанном городе (по умолчанию Montreal)\n` +
    `/погода [город] - То же самое на русском\n\n` +
    `💡 Вы также можете просто написать "погода" или "weather" в сообщении!`;
  
  bot.sendMessage(chatId, helpMessage);
});

// Обработчик команд погоды
bot.onText(/\/weather|\/погода/, async (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text;
  
  // Извлекаем название города из команды, если указано
  const cityMatch = text.match(/\/(?:weather|погода)\s+(.+)/i);
  const city = cityMatch ? cityMatch[1].trim() : 'Montreal';
  
  const weatherInfo = await getWeather(city);
  bot.sendMessage(chatId, weatherInfo);
});

// Обработчик всех сообщений
bot.on('message', async (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text ? msg.text.toLowerCase() : '';

  // Проверяем, не является ли это командой
  if (msg.text && msg.text.startsWith('/')) {
    return; // Команды обрабатываются отдельно
  }

  // Проверяем, содержит ли сообщение запрос о погоде
  if (text.includes('погода') || text.includes('weather') || text.includes('температура')) {
    // Пытаемся извлечь название города из сообщения
    const cityMatch = text.match(/(?:погода|weather|температура)\s+(?:в|in)?\s*([а-яёa-z\s]+)/i);
    const city = cityMatch ? cityMatch[1].trim() : 'Montreal';
    
    const weatherInfo = await getWeather(city);
    bot.sendMessage(chatId, weatherInfo);
    return;
  }

  // Для всех остальных сообщений - обычное приветствие
  const randomGreeting = greetings[Math.floor(Math.random() * greetings.length)];
  const randomWisdom = wisdoms[Math.floor(Math.random() * wisdoms.length)];

  const reply = `${randomGreeting}\n\nМудрость дня: ${randomWisdom}`;

  bot.sendMessage(chatId, reply);
});

// Serverless функция для Vercel
module.exports = async (req, res) => {
  // Vercel требует ответа в течение 10 секунд для бесплатного плана
  // Поэтому обрабатываем асинхронно и сразу отвечаем
  if (req.method === 'POST') {
    const update = req.body;
    
    // Обрабатываем обновление асинхронно
    bot.processUpdate(update).catch(err => {
      console.error('Ошибка при обработке обновления:', err);
    });
    
    // Сразу отвечаем Telegram, чтобы избежать таймаута
    res.status(200).json({ ok: true });
  } else {
    res.status(200).json({ message: 'Telegram Bot Webhook Endpoint' });
  }
};
