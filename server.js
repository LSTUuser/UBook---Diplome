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

// Функция для перестройки последовательности книг
async function resetLiteratureSequence() {
    await pool.query(`
        SELECT setval('literature_book_id_seq', 
            (SELECT COALESCE(MAX(book_id), 0) FROM literature));
    `);
}

// Функция для перестройки последовательности авторов
async function resetAuthorsSequence() {
    await pool.query(`
        SELECT setval('authors_author_id_seq', 
            (SELECT COALESCE(MAX(author_id), 0) FROM authors));
    `);
}

// Проверка УДК
app.get('/api/validate-udc/:udc_id', async (req, res) => {
    const { udc_id } = req.params;

    try {
        const result = await pool.query('SELECT 1 FROM udc WHERE udc_id = $1', [udc_id]);

        if (result.rowCount > 0) {
            return res.status(200).json({ message: 'УДК найдено' });
        } else {
            return res.status(404).json({ message: 'УДК не найдено' });
        }
    } catch (error) {
        console.error('Ошибка при проверке УДК:', error);
        res.status(500).json({ message: 'Ошибка при проверке УДК' });
    }
});


// Добавление книги
app.post('/api/books', async (req, res) => {
    const { book_name, author_full_name, year_of_publishing, udc_id, quantity } = req.body;

    try {
        console.log("Данные для добавления книги:", req.body);
        
        // Проверка на наличие UDC
        const udcResult = await pool.query('SELECT 1 FROM udc WHERE udc_id = $1', [udc_id]);
        if (udcResult.rowCount === 0) {
            return res.status(400).json({ message: 'УДК не найдено' });
        }

        // Вставка новой книги в таблицу
        const result = await pool.query(`
            INSERT INTO literature (book_name, year_of_publishing, udc_id, quantity, available)
            VALUES ($1, $2, $3, $4, true)
            RETURNING book_id, book_name, year_of_publishing, udc_id, quantity, available;
        `, [book_name, year_of_publishing, udc_id, quantity]);

        // Перестройка последовательности для книг
        await resetLiteratureSequence();

        console.log("Книга добавлена:", result.rows[0]);

        // Вставляем автора, если его еще нет
        const authorResult = await pool.query(`
            INSERT INTO authors (author_full_name) 
            VALUES ($1) 
            ON CONFLICT (author_full_name) DO NOTHING
            RETURNING author_id;
        `, [author_full_name]);

        // Перестройка последовательности для авторов
        await resetAuthorsSequence();

        let authorId;

        if (authorResult.rows.length === 0) {
            // Если автор уже существует, получаем его ID
            const existingAuthor = await pool.query(`
                SELECT author_id FROM authors WHERE author_full_name = $1;
            `, [author_full_name]);
            authorId = existingAuthor.rows[0].author_id;
        } else {
            // Если автор был добавлен, используем его ID
            authorId = authorResult.rows[0].author_id;
        }

        console.log("Автор добавлен или найден:", authorId);

        // Соединяем книгу с автором
        if (authorId) {
            await pool.query(`
                INSERT INTO write (book_id, author_id) 
                VALUES ($1, $2);
            `, [result.rows[0].book_id, authorId]);
            console.log("Книга и автор связаны");
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Ошибка при добавлении книги:', error);
        res.status(500).json({ message: 'Ошибка при добавлении книги' });
    }
});

// Обработчик для удаления книги
app.delete('/api/books/:id', async (req, res) => {
    const bookId = req.params.id;

    try {
        // Удаляем книгу из базы данных
        await pool.query('DELETE FROM literature WHERE book_id = $1', [bookId]);
         // Перенумерация оставшихся книг
         await pool.query(`
            WITH reordered_books AS (
                SELECT book_id
                FROM literature
                ORDER BY book_id
            )
            UPDATE literature
            SET book_id = reordered_books.row_number
            FROM (
                SELECT book_id, ROW_NUMBER() OVER (ORDER BY book_id) AS row_number
                FROM literature
            ) AS reordered_books
            WHERE literature.book_id = reordered_books.book_id;
        `);
        await resetLiteratureSequence();
        res.json({ message: 'Книга успешно удалена' });
    } catch (error) {
        console.error('Ошибка при удалении книги:', error);
        res.status(500).json({ message: 'Ошибка при удалении книги' });
    }
});

// Запуск сервера
app.listen(PORT, () => {
    console.log(`Сервер запущен на http://localhost:${PORT}`);
});
