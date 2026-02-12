# Деплой Telegram-бота на Vercel

## Важные изменения для Vercel

Бот был модифицирован для работы с **webhooks** вместо **long polling**, так как Vercel - это serverless платформа, которая не поддерживает постоянно работающие процессы.

## Шаги для деплоя

### 1. Установите Vercel CLI (если еще не установлен)
```bash
npm i -g vercel
```

### 2. Войдите в Vercel
```bash
vercel login
```

### 3. Деплой проекта
```bash
vercel
```

Или для production:
```bash
vercel --prod
```

### 4. Настройте переменные окружения в Vercel

После деплоя получите URL вашего проекта (например: `https://your-bot.vercel.app`)

1. Перейдите в [Vercel Dashboard](https://vercel.com/dashboard)
2. Выберите ваш проект
3. Перейдите в Settings → Environment Variables
4. Добавьте переменные:
   - `BOT_TOKEN` - токен вашего Telegram бота
   - `WEATHER_API_KEY` - ключ OpenWeatherMap API

### 5. Настройте Webhook в Telegram

После деплоя нужно настроить webhook, чтобы Telegram отправлял обновления на ваш сервер.

**Вариант 1: Через браузер (самый простой)**
```
https://api.telegram.org/bot<ВАШ_ТОКЕН>/setWebhook?url=https://your-bot.vercel.app/api/bot
```

Замените:
- `<ВАШ_ТОКЕН>` на токен вашего бота
- `https://your-bot.vercel.app` на ваш URL от Vercel

**Вариант 2: Через curl (в терминале)**
```bash
curl -X POST "https://api.telegram.org/bot<ВАШ_ТОКЕН>/setWebhook?url=https://your-bot.vercel.app/api/bot"
```

**Вариант 3: Через Node.js скрипт**
Создайте файл `setup-webhook.js`:
```javascript
const axios = require('axios');
require('dotenv').config();

const token = process.env.BOT_TOKEN;
const webhookUrl = 'https://your-bot.vercel.app/api/bot'; // Замените на ваш URL

axios.post(`https://api.telegram.org/bot${token}/setWebhook`, {
  url: webhookUrl
}).then(response => {
  console.log('Webhook установлен:', response.data);
}).catch(error => {
  console.error('Ошибка:', error.response?.data || error.message);
});
```

Запустите:
```bash
node setup-webhook.js
```

### 6. Проверьте webhook

Проверить, что webhook установлен:
```
https://api.telegram.org/bot<ВАШ_ТОКЕН>/getWebhookInfo
```

## Важные замечания

1. **Таймауты**: Vercel бесплатный план имеет лимит 10 секунд на выполнение функции. Бот настроен так, чтобы отвечать Telegram сразу, а обработку делать асинхронно.

2. **Переменные окружения**: Убедитесь, что все переменные окружения добавлены в Vercel Dashboard.

3. **Локальная разработка**: Для локальной разработки используйте оригинальный `index.js` с polling. Для деплоя на Vercel используется `api/bot.js` с webhooks.

4. **Обновление webhook**: Если вы изменили URL или передеплоили проект, нужно обновить webhook командой из шага 5.

## Отключение webhook (для возврата к polling)

Если хотите вернуться к локальной разработке с polling:
```
https://api.telegram.org/bot<ВАШ_ТОКЕН>/deleteWebhook
```

## Структура проекта

```
HelloBot/
├── api/
│   └── bot.js          # Serverless функция для Vercel (webhook)
├── index.js            # Локальная версия с polling
├── package.json
├── vercel.json         # Конфигурация Vercel
└── .env                # Локальные переменные окружения
```

## Troubleshooting

- **Бот не отвечает**: Проверьте, что webhook установлен правильно и переменные окружения добавлены в Vercel
- **Таймауты**: Убедитесь, что обработка сообщений быстрая (текущая реализация отвечает сразу)
- **Ошибки деплоя**: Проверьте, что все зависимости указаны в `package.json`
