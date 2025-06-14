# SQL Optimizer

Проект для оптимизации SQL-запросов с использованием LLM (Large Language Models). Система анализирует SQL-запросы и предлагает оптимизированные версии с объяснением изменений.

## Архитектура проекта

Проект состоит из трех основных компонентов:

1. **Frontend** (React + TypeScript)
   - Современный пользовательский интерфейс
   - Взаимодействие с бэкендом через REST API
   - WebSocket для real-time обновлений

2. **Backend** (Spring Boot)
   - REST API для обработки запросов
   - Интеграция с LLM
   - Управление базой данных
   - WebSocket сервер

3. **База данных** (PostgreSQL)
   - Хранение SQL-запросов
   - История оптимизаций
   - Пользовательские данные

## Требования

- Docker и Docker Compose
- Java 17 или выше
- Node.js 16 или выше
- LM Studio (для локального LLM)

## Установка и запуск

### 1. Клонирование репозитория

```bash
git clone <repository-url>
cd sql-optimizer
```

### 2. Настройка локального LLM

#### Вариант 1: LM Studio

1. Скачайте и установите [LM Studio](https://lmstudio.ai/)
2. Запустите LM Studio
3. Скачайте модель `llama-3.2-1b-instruct`
4. В настройках LM Studio:
   - Включите "Local Server"
   - Установите порт 1234
   - Включите "Streaming"

#### Вариант 2: Консольный запуск

1. Скачайте модель `llama-3.2-1b-instruct`
2. Запустите модель через консоль:

```bash
python -m llama_cpp.server --model path/to/llama-3.2-1b-instruct.gguf --port 1234
```

### 3. Запуск проекта

```bash
docker-compose up --build
```

После запуска:
- Frontend будет доступен по адресу: http://localhost:3000
- Backend API: http://localhost:8080
- Swagger UI: http://localhost:8080/swagger-ui/index.html

## Конфигурация

### Backend

Основные настройки находятся в `opt_back/src/main/resources/application.properties`:

```properties
# LLM Configuration
llm.provider=local
llm.api-url=http://localhost:1234
llm.model=llama-3.2-1b-instruct
llm.max-tokens=2048
llm.temperature=0.7
```

### Frontend

Настройки API находятся в `opt_front/.env`:

```env
REACT_APP_API_URL=http://localhost:8080
```

## Использование

1. Зарегистрируйтесь или войдите в систему
2. Введите SQL-запрос для оптимизации
3. Система проанализирует запрос и предложит оптимизированную версию
4. Просмотрите историю оптимизаций в разделе "История"

## API Endpoints

### Аутентификация
- POST `/auth/register` - Регистрация
- POST `/auth/login` - Вход
- GET `/auth/me` - Информация о текущем пользователе

### SQL Оптимизация
- POST `/sql/optimize` - Оптимизация SQL-запроса

### WebSocket
- `/ws` - WebSocket endpoint для real-time обновлений

## Разработка

### Backend

```bash
cd opt_back
./gradlew bootRun
```

### Frontend

```bash
cd opt_front
npm install
npm start
```

## Лицензия

MIT License 