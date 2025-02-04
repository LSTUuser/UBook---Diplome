require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Подключение к базе данных PostgreSQL
const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Маршруты для пользовательского интерфейса
app.use('/user', express.static(path.join(__dirname, 'public', 'user')));

// Маршруты для административного интерфейса
app.use('/admin', express.static(path.join(__dirname, 'public', 'admin')));

// Обработчик логина (пока заглушка)
app.post('/login', (req, res) => {
    res.send('Обработка логина');
});

// Проверка подключения к базе данных
app.get('/api/test-db', async (req, res) => {
  try {
      // Выполним простой запрос для проверки соединения
      const result = await pool.query('SELECT NOW()');
      res.json({ message: 'Подключение к базе данных успешно!', time: result.rows[0].now });
  } catch (error) {
      console.error('Ошибка при подключении к базе данных:', error);
      res.status(500).json({ message: 'Ошибка подключения к базе данных' });
  }
});


// Получение списка книг
app.get('/api/books', async (req, res) => {
    try {
      const result = await pool.query(`
        SELECT
            l.book_id,
            l.udc_id, 
            w.author_id,
            l.book_name,
            l.year_of_publishing,
            u.udc_name, 
            l.quantity,
            a.author_full_name
        FROM 
            literature l
        JOIN 
            write w ON l.book_id = w.book_id
        JOIN 
            authors a ON w.author_id = a.author_id
        JOIN 
            udc u ON l.udc_id = u.udc_id
        ORDER BY l.book_id DESC;
      `);
      res.json(result.rows);
    } catch (error) {
      console.error('Ошибка при получении книг:', error);
      res.status(500).json({
        message: 'Ошибка сервера',
        error: error.message,
        stack: error.stack
      });
    }
  });  

app.put('/api/books/:id', async (req, res) => {
    const bookId = req.params.id;
    const { book_name, year_of_publishing, udc_id, quantity } = req.body;

    try {
        // Обновляем данные книги
        const result = await pool.query(`
            UPDATE literature
            SET
                book_name = $1,
                year_of_publishing = $2,
                udc_id = $3,
                quantity = $4
            WHERE book_id = $5
            RETURNING *;
        `, [book_name, year_of_publishing, udc_id, quantity, bookId]);

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Книга не найдена' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Ошибка при обновлении книги:', error);
        res.status(500).json({ message: 'Ошибка при обновлении книги' });
    }
});
;


app.post("/addBook", (req, res) => {
    const { title, author, year } = req.body;
    
    // Здесь должна быть логика добавления книги в базу данных
    const newBook = { title, author, year, id: Date.now() }; // Временный ID

    // Ответ сервера
    res.json({ success: true, book: newBook });
});


// Запуск сервера
app.listen(PORT, () => {
    console.log(`Сервер запущен на http://localhost:${PORT}`);
});
