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
    console.error('Убедитесь, что BOT_TOKEN добавлен в Vercel Dashboard → Settings → Environment Variables');
    return null;
  }
  
  bot = new TelegramBot(token);
  
  // Регистрируем обработчики после создания бота
  setupHandlers(bot);
  
  return bot;
}

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

// Функция для настройки обработчиков
function setupHandlers(botInstance) {
  console.log('Setting up bot handlers...');
  
  // Обработчик команды /start
  botInstance.onText(/\/start/, (msg) => {
    console.log('✅ /start command received!');
    const chatId = msg.chat.id;
    console.log('Chat ID:', chatId);
    
    const randomGreeting = greetings[Math.floor(Math.random() * greetings.length)];
    const randomWisdom = wisdoms[Math.floor(Math.random() * wisdoms.length)];
    
    const welcomeMessage = `${randomGreeting}\n\nМудрость дня: ${randomWisdom}\n\n` +
      `Я умею:\n` +
      `🌤️ Показывать погоду - напишите "погода" или используйте команды /weather или /погода\n` +
      `💬 Общаться - просто напишите мне что-нибудь!\n\n` +
      `Попробуйте написать "погода Москва" или "/weather London"`;
    
    console.log('Sending welcome message...');
    botInstance.sendMessage(chatId, welcomeMessage).then(() => {
      console.log('✅ Welcome message sent successfully');
    }).catch(err => {
      console.error('❌ Error sending welcome message:', err);
    });
  });

  // Обработчик команды /help
  botInstance.onText(/\/help/, (msg) => {
    console.log('✅ /help command received!');
    const chatId = msg.chat.id;
    const helpMessage = `📋 Доступные команды:\n\n` +
      `/start - Начать работу с ботом\n` +
      `/help - Показать эту справку\n` +
      `/weather [город] - Погода в указанном городе (по умолчанию Montreal)\n` +
      `/погода [город] - То же самое на русском\n\n` +
      `💡 Вы также можете просто написать "погода" или "weather" в сообщении!`;
    
    botInstance.sendMessage(chatId, helpMessage).catch(err => {
      console.error('❌ Error sending help message:', err);
    });
  });

  // Обработчик команд погоды
  botInstance.onText(/\/weather|\/погода/, async (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text;
  
  // Извлекаем название города из команды, если указано
  const cityMatch = text.match(/\/(?:weather|погода)\s+(.+)/i);
  const city = cityMatch ? cityMatch[1].trim() : 'Montreal';
  
    const weatherInfo = await getWeather(city);
    botInstance.sendMessage(chatId, weatherInfo);
  });

  // Обработчик всех сообщений
  botInstance.on('message', async (msg) => {
    console.log('✅ Message received:', msg.text);
    const chatId = msg.chat.id;
    const text = msg.text ? msg.text.toLowerCase() : '';

    // Проверяем, не является ли это командой
    if (msg.text && msg.text.startsWith('/')) {
      console.log('Message is a command, skipping general handler');
      return; // Команды обрабатываются отдельно
    }

  // Проверяем, содержит ли сообщение запрос о погоде
  if (text.includes('погода') || text.includes('weather') || text.includes('температура')) {
    // Пытаемся извлечь название города из сообщения
    const cityMatch = text.match(/(?:погода|weather|температура)\s+(?:в|in)?\s*([а-яёa-z\s]+)/i);
    const city = cityMatch ? cityMatch[1].trim() : 'Montreal';
    
    const weatherInfo = await getWeather(city);
    botInstance.sendMessage(chatId, weatherInfo);
    return;
  }

  // Для всех остальных сообщений - обычное приветствие
  const randomGreeting = greetings[Math.floor(Math.random() * greetings.length)];
  const randomWisdom = wisdoms[Math.floor(Math.random() * wisdoms.length)];

  const reply = `${randomGreeting}\n\nМудрость дня: ${randomWisdom}`;

  botInstance.sendMessage(chatId, reply).catch(err => {
    console.error('❌ Error sending message:', err);
  });
  });
  
  console.log('✅ All handlers set up successfully');
}

// Serverless функция для Vercel
module.exports = async (req, res) => {
  try {
    console.log('=== Function called ===');
    console.log('Method:', req.method);
    
    // Обработка OPTIONS для CORS (если нужно)
    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }
    
    // Инициализируем бота (проверяем переменные окружения здесь)
    const currentBot = initializeBot();
    const token = process.env.BOT_TOKEN;
    
    console.log('Token exists:', !!token);
    console.log('Bot initialized:', !!currentBot);
    
    // Для GET запросов - возвращаем информацию о статусе
    if (req.method === 'GET') {
      return res.status(200).json({ 
        message: 'Telegram Bot Webhook Endpoint',
        version: '2.1',
        token_configured: !!token,
        token_length: token ? token.length : 0,
        has_weather_key: !!process.env.WEATHER_API_KEY,
        env_keys: Object.keys(process.env).filter(k => k.includes('BOT') || k.includes('WEATHER'))
      });
    }
    
    // Проверяем наличие токена для POST запросов
    if (!token || !currentBot) {
      console.error('BOT_TOKEN не найден в переменных окружения');
      console.error('Текущие env vars:', Object.keys(process.env).filter(k => k.includes('BOT') || k.includes('WEATHER')));
      // Всегда возвращаем 200 для POST, чтобы Telegram не считал это ошибкой
      return res.status(200).json({ ok: true, error: 'BOT_TOKEN not configured' });
    }

    // Обработка POST запросов от Telegram
    if (req.method === 'POST') {
      const update = req.body;
      
      if (!update) {
        console.error('No update in request body');
        return res.status(200).json({ ok: true, error: 'No update provided' });
      }
      
      console.log('=== Received update ===');
      console.log('Update type:', update.message ? 'message' : update.callback_query ? 'callback' : 'other');
      console.log('Update ID:', update.update_id);
      if (update.message) {
        console.log('Message text:', update.message.text);
        console.log('Chat ID:', update.message.chat.id);
      }
      
      // Обрабатываем обновление асинхронно (не ждем завершения)
      currentBot.processUpdate(update).then(() => {
        console.log('✅ Update processed successfully');
      }).catch(err => {
        console.error('❌ Ошибка при обработке обновления:');
        console.error('Error message:', err.message);
        console.error('Error stack:', err.stack);
        if (err.response) {
          console.error('Error response:', JSON.stringify(err.response.data, null, 2));
        }
      });
      
      // Сразу отвечаем Telegram с правильным форматом (всегда 200 OK)
      return res.status(200).json({ ok: true });
    }
    
    // Для всех остальных методов
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('❌ Unexpected error:', error);
    // Всегда возвращаем 200 для POST, чтобы не блокировать Telegram
    if (req.method === 'POST') {
      return res.status(200).json({ ok: true, error: error.message });
    }
    return res.status(500).json({ error: error.message });
  }
  } else {
    // GET запрос - возвращаем информацию о статусе
    const token = process.env.BOT_TOKEN;
    return res.status(200).json({ 
      message: 'Telegram Bot Webhook Endpoint',
      version: '2.0',
      token_configured: !!token,
      token_length: token ? token.length : 0,
      has_weather_key: !!process.env.WEATHER_API_KEY,
      env_keys: Object.keys(process.env).filter(k => k.includes('BOT') || k.includes('WEATHER'))
    });
  }
};
