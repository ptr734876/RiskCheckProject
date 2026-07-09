
# Atlas Sales Backend

Рабочий учебный Flask-бэкенд для макета сервиса **«Атлас продаж»**.

## Реализовано

- регистрация, вход, выход и текущий пользователь;
- гостевой режим;
- сохранение анкеты;
- каталог объектов недвижимости;
- демонстрационный объект `ул. Садовая, 14`;
- юридические сведения и окружение объекта;
- rule-based анализ рисков окружения;
- персонализируемый список документов по анкете;
- отметка собранных документов и расчёт прогресса;
- алгоритмы действий;
- отметка шагов и расчёт прогресса;
- статьи, поиск и фильтрация;
- данные для карты и МФЦ;
- автоматические тесты.

## Важно

Это MVP. Реальные интеграции с Росреестром, ЕГРН, картографическими API,
СПС и реестрами риелторов не подменены выдуманными запросами.
Сейчас используются демонстрационные данные и готовые точки расширения.

## Запуск на Ubuntu / Linux

```bash
cd atlas-sales-backend

python3 --version
python3 -m venv .venv
source .venv/bin/activate

python -m pip install --upgrade pip
pip install -r requirements.txt

cp .env.example .env

flask --app run.py init-db
flask --app run.py seed-demo
flask --app run.py run --debug
```

Открыть:

```text
http://127.0.0.1:5000/api/health
```

## Тесты

```bash
pytest
```

## API

### Авторизация

```text
POST /api/auth/register
POST /api/auth/login
POST /api/auth/logout
GET  /api/auth/me
POST /api/auth/guest
```

### Анкета

```text
GET /api/questionnaire
PUT /api/questionnaire
```

### Недвижимость

```text
GET /api/properties
GET /api/properties?q=Садовая
GET /api/properties/<id>
```

### Риски

```text
GET /api/risks/property/<property_id>
```

### Документы

```text
GET  /api/documents
POST /api/documents/<document_id>/toggle
```

### Алгоритмы

```text
GET  /api/algorithms
GET  /api/algorithms/<algorithm_id>
POST /api/algorithms/steps/<step_id>/toggle
```

### Материалы

```text
GET /api/materials
GET /api/materials?q=ЕГРН
GET /api/materials?category=documents
GET /api/materials/<material_id>
```

### Карта

```text
GET /api/map/property/<property_id>/markers
GET /api/map/document-points
```

## Пример регистрации

```bash
curl -X POST http://127.0.0.1:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -c cookies.txt \
  -d '{
    "full_name": "Ирина Иванова",
    "email": "ira@example.com",
    "password": "secret123"
  }'
```

## Пример анкеты

```bash
curl -X PUT http://127.0.0.1:5000/api/questionnaire \
  -H "Content-Type: application/json" \
  -b cookies.txt -c cookies.txt \
  -d '{
    "owners_count": "multiple",
    "maternity_capital": true,
    "property_type": "apartment",
    "redevelopment": "unauthorized",
    "sale_urgency": "three_months",
    "current_step": 3,
    "completed": true
  }'
```

После этого:

```bash
curl http://127.0.0.1:5000/api/documents -b cookies.txt
```

вернёт персонализированный список документов.

## Архитектура

```text
app/
├── auth/
├── questionnaire/
├── property/
├── risks/
├── documents/
├── algorithms/
├── materials/
├── map_api/
├── models/
├── config.py
├── extensions.py
└── __init__.py
```

Используются application factory и Blueprints.

## Подключение frontend

Когда будет код frontend, его JavaScript-запросы нужно направить на эти API.
Если frontend и backend работают на разных origin/портах, отдельно настраивается CORS.
