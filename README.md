# Skinport Price Tracker & Purchase System

Микросервис для отслеживания цен на предметы с Skinport API и обработки покупок

## Стек технологий

![TypeScript](https://img.shields.io/badge/-TypeScript-3178C6?logo=typescript&logoColor=white)
![Fastify](https://img.shields.io/badge/-Fastify-000000?logo=fastify)
![Redis](https://img.shields.io/badge/-Redis-DC382D?logo=redis&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/-PostgreSQL-4169E1?logo=postgresql&logoColor=white)

## Функционал

- 🚀 **Эндпоинт /items**  
  Получение списка предметов с минимальными ценами (tradable/non-tradable)
  - Кэширование в Redis с TTL 5 минут
  - 3 попытки повторного запроса при ошибках API
  - Автоматическое фоновое обновление кэша

- 🛒 **Эндпоинт /purchases**  
  Система покупки товаров:
  - Транзакционная обработка операций
  - Валидация входящих данных
  - Проверка остатка баланса
  - Поддержка конкурентных запросов

## Установка

### 1. Требования
- Node.js v18+
- Redis 7+
- PostgreSQL 15+
- NPM 9+

### 2. Настройка окружения
```bash
git clone https://github.com/anna-fridrih/test_ItemShopAPI.git
cd test_ItemShopAPI
cp .env.example .env # Заполните параметры в .env
```

### 3. Установка зависимостей
```bash
npm install
```

### 4. Инициализация БД
1. Создайте базу данных и пользователя:
```bash
createdb test_task_db
createuser test_user
psql -c "ALTER USER test_user WITH PASSWORD '1234';"
psql -c "GRANT ALL PRIVILEGES ON DATABASE test_task_db TO test_user;"
```

2. Примените миграции:
```bash
psql -d test_task_db -U test_user -a -f migrations/001_create_users_table.sql
psql -d test_task_db -U test_user -a -f migrations/002_create_products_table.sql
psql -d test_task_db -U test_user -a -f migrations/003_create_purchases_table.sql
```

## Конфигурация (файл .env)
```ini
# PostgreSQL
DB_HOST=localhost
DB_PORT=5432
DB_NAME=test_task_db
DB_USER=test_user
DB_PASSWORD=1234

# Redis
REDIS_URL=redis://localhost:6379

# Сервер
PORT=3000
LOG_LEVEL=info

# Skinport API
SKINPORT_API_URL=https://api.skinport.com/v1/items
SKINPORT_API_RETRIES=3
SKINPORT_API_DELAY_MS=2000

# Кэширование
CACHE_TTL_SEC=300
```

## Запуск приложения

### Режим разработки
```bash
npm run dev
```

### Продакшен-сборка
```bash
npm run build
npm start
```

## API Endpoints

### GET /items
Получение списка предметов

**Пример запроса:**
```bash
curl http://localhost:3000/items
```

**Успешный ответ (200):**
```json
{
  "items": [
    {
      "name": "AK-47 | Redline",
      "min_prices": {
        "tradable": 12.45,
        "non_tradable": 14.20
      }
    }
  ]
}
```

**Ошибки:**
- 500 - Ошибка сервера
- 503 - Используется устаревший кэш

### POST /purchases
Совершение покупки

**Параметры запроса:**
```json
{
  "userId": 1,
  "productId": 2
}
```

## Примеры запросов

### Успешная покупка
```bash
curl -X POST http://localhost:3000/purchases \
  -H "Content-Type: application/json" \
  -d '{"userId": 1, "productId": 1}'
```

## Структура базы данных

Схема БД задается через миграции:
```
migrations/
├── 001_create_users_table.sql       # Пользователи
├── 002_create_products_table.sql    # Товары
└── 003_create_purchases_table.sql   # История покупок
```

Для просмотра структуры выполните:
```bash
psql -d test_task_db -c "\d users"
psql -d test_task_db -c "\d products"
psql -d test_task_db -c "\d purchases"
```

## Логирование

Уровни логирования (настраивается через LOG_LEVEL):
- `trace` - Детальная отладка транзакций
- `debug` - Запросы к БД и Redis
- `info` - Основные события системы
- `warn` - Потенциальные проблемы
- `error` - Критические ошибки
- `fatal` - Неустранимые ошибки

**Формат логов:**
```
[2024-03-15 14:30:45] INFO (200): GET /items - 127.0.0.1 - 142ms
[2024-03-15 14:31:12] ERROR (404): User 999 not found
```
