// Load environment variables (dotenv for local, process.env for Vercel)
require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');

// Переменные окружения будут проверяться внутри функции
let bot = null;
let weatherApiKey = null;

// Функция для инициализации бота (вызывается при первом запросе)
function initializeBot() {
  if (bot) return bot; // Уже инициализирован
  
  const token = process.env.BOT_TOKEN;
  weatherApiKey = process.env.WEATHER_API_KEY;
  
  if (!token) {
    console.error('Ошибка: не задан BOT_TOKEN в переменных окружения');
    return null;
  }
  
  bot = new TelegramBot(token);
  setupHandlers(bot);
  return bot;
}

const greetings = [
  'Привет, я бот!',
  'Здравствуйте, я бот!',
  'Добрый день, я бот!'
];

const wisdoms = [
  'Каждый день — новый шанс стать лучше, чем вчера.',
  'Самый тёмный час — перед рассветом.',
  'Маленький шаг сегодня лучше, чем большое «завтра».',
  'Не бойся ошибок — бойся бездействия.',
  'Сила в том, чтобы начать, мудрость — чтобы продолжать.'
];

async function getWeather(city = 'Montreal') {
  if (!weatherApiKey) {
    return 'Ошибка: не задан WEATHER_API_KEY. Получите ключ на https://openweathermap.org/api';
  }

  try {
    const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${weatherApiKey}&units=metric&lang=ru`;
    const response = await axios.get(url);
    const data = response.data;

    const weatherEmoji = {
      'Clear': '☀️', 'Clouds': '☁️', 'Rain': '🌧️', 'Drizzle': '🌦️',
      'Thunderstorm': '⛈️', 'Snow': '❄️', 'Mist': '🌫️', 'Fog': '🌫️'
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

function setupHandlers(botInstance) {
  botInstance.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    const randomGreeting = greetings[Math.floor(Math.random() * greetings.length)];
    const randomWisdom = wisdoms[Math.floor(Math.random() * wisdoms.length)];
    
    const welcomeMessage = `${randomGreeting}\n\nМудрость дня: ${randomWisdom}\n\n` +
      `Я умею:\n` +
      `🌤️ Показывать погоду - напишите "погода" или используйте команды /weather или /погода\n` +
      `💬 Общаться - просто напишите мне что-нибудь!\n\n` +
      `Попробуйте написать "погода Москва" или "/weather London"`;
    
    botInstance.sendMessage(chatId, welcomeMessage).catch(err => {
      console.error('Error sending welcome message:', err);
    });
  });

  botInstance.onText(/\/help/, (msg) => {
    const chatId = msg.chat.id;
    const helpMessage = `📋 Доступные команды:\n\n` +
      `/start - Начать работу с ботом\n` +
      `/help - Показать эту справку\n` +
      `/weather [город] - Погода в указанном городе (по умолчанию Montreal)\n` +
      `/погода [город] - То же самое на русском\n\n` +
      `💡 Вы также можете просто написать "погода" или "weather" в сообщении!`;
    
    botInstance.sendMessage(chatId, helpMessage).catch(err => {
      console.error('Error sending help message:', err);
    });
  });

  botInstance.onText(/\/weather|\/погода/, async (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text;
    const cityMatch = text.match(/\/(?:weather|погода)\s+(.+)/i);
    const city = cityMatch ? cityMatch[1].trim() : 'Montreal';
    const weatherInfo = await getWeather(city);
    botInstance.sendMessage(chatId, weatherInfo).catch(err => {
      console.error('Error sending weather:', err);
    });
  });

  botInstance.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text ? msg.text.toLowerCase() : '';

    if (msg.text && msg.text.startsWith('/')) {
      return;
    }

    if (text.includes('погода') || text.includes('weather') || text.includes('температура')) {
      const cityMatch = text.match(/(?:погода|weather|температура)\s+(?:в|in)?\s*([а-яёa-z\s]+)/i);
      const city = cityMatch ? cityMatch[1].trim() : 'Montreal';
      const weatherInfo = await getWeather(city);
      botInstance.sendMessage(chatId, weatherInfo).catch(err => {
        console.error('Error sending weather:', err);
      });
      return;
    }

    const randomGreeting = greetings[Math.floor(Math.random() * greetings.length)];
    const randomWisdom = wisdoms[Math.floor(Math.random() * wisdoms.length)];
    const reply = `${randomGreeting}\n\nМудрость дня: ${randomWisdom}`;

    botInstance.sendMessage(chatId, reply).catch(err => {
      console.error('Error sending message:', err);
    });
  });
}

// Serverless функция для Vercel
module.exports = async (req, res) => {
  // Логируем ВСЕГДА в самом начале - ДО любых проверок
  console.log('=== FUNCTION CALLED ===');
  console.log('Method:', req.method);
  console.log('URL:', req.url);
  
  // Для GET запросов
  if (req.method === 'GET') {
    const token = process.env.BOT_TOKEN;
    return res.status(200).json({ 
      message: 'Telegram Bot Webhook Endpoint',
      version: '3.3-FIXED',
      token_configured: !!token,
      has_weather_key: !!process.env.WEATHER_API_KEY
    });
  }
  
  // Для POST запросов
  if (req.method === 'POST') {
    console.log('POST request received');
    
    // Сразу возвращаем 200 OK для Telegram
    res.status(200).json({ ok: true });
    
    // Потом обрабатываем асинхронно
    setImmediate(() => {
      try {
        console.log('Processing update asynchronously');
        const update = req.body;
        if (update) {
          console.log('Update ID:', update.update_id);
          const currentBot = initializeBot();
          if (currentBot) {
            currentBot.processUpdate(update).catch(err => {
              console.error('Error processing:', err.message);
            });
          } else {
            console.error('Bot not initialized');
          }
        } else {
          console.log('No update in body');
        }
      } catch (err) {
        console.error('Error in async processing:', err);
      }
    });
    
    return;
  }
  
  // Для остальных методов
  res.status(405).json({ error: 'Method not allowed' });
};
