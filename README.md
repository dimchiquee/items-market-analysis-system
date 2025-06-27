## Запуск
### 1. Клонирование репозитория
Клонируйте репозиторий любым удобным для Вас способом.
```bash
git clone https://github.com/dimchiquee/items-market-analysis-system.git
```
```bash
cd items-market-analysis-system
```

---

### 2. Настройка backend
1. **Создайте виртуальное окружение, активируйте его и установите зависимости:**
    ```bash
    python -m venv venv
    ```
    ```bash
    source venv/Scripts/activate
    ```
    ```bash
    pip install -r requirements.txt
    ```

2. **Создайте файл `.env` в директории `backend` со следующим содержимым:**

    ```
    STEAM_API_KEY=ваш_API_ключ
    JWT_SECRET_KEY=ваш_JWT_токен
    REDIRECT_URL=http://localhost:8000/auth/steam/callback
    ```

    - **Получение STEAM_API_KEY:**  
      Зарегистрировать на [Steam API](https://steamcommunity.com/dev/apikey)
    - **Получение JWT_SECRET_KEY:**  
      Сгенерировать командой в powershell:
      ```powershell
      [Convert]::ToBase64String((1..32 | ForEach-Object {Get-Random -Maximum 256}))
      ```

---

### 3. Настройте frontend

В директории `frontend` установите зависимости:

```bash
npm install
```

---

### 4. Запуск системы

Запустите **два терминала**:

- **Запуск серверной части:**
    ```bash
    cd backend
    fastapi dev
    ```
- **Запуск клиентской части:**
    ```bash
    cd frontend
    npm run dev
    ```

Приложение будет доступно по адресу:  
[http://localhost:5173/](http://localhost:5173/)

---

### 5. Авторизация

Для использования веб-приложения выполните авторизацию через свой аккаунт Steam.

---
