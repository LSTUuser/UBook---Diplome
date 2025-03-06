require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const path = require('path');
const bcrypt = require('bcrypt');

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
app.use(express.urlencoded({ extended: true }));

// Маршруты для пользовательского интерфейса
app.use('/user', express.static(path.join(__dirname, 'public', 'user')));

// Маршруты для административного интерфейса
app.use('/admin', express.static(path.join(__dirname, 'public', 'admin')));

// Обработчик логина
app.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        // Поиск пользователя в базе данных по email
        const userResult = await pool.query('SELECT * FROM "user" WHERE email = $1', [email]);

        // Если пользователь не найден
        if (userResult.rows.length === 0) {
            return res.status(401).json({ success: false }); // Возвращаем только статус
        }

        const user = userResult.rows[0];

        // Сравнение хэшированного пароля
        const isPasswordValid = await bcrypt.compare(password, user.password);

        // Если пароль неверный
        if (!isPasswordValid) {
            return res.status(401).json({ success: false }); // Возвращаем только статус
        }

        // Если всё успешно, возвращаем данные пользователя (без пароля)
        res.status(200).json({
            success: true,
            user: {
                id: user.id,
                username: user.username,
                email: user.email
            }
        });
    } catch (error) {
        console.error('Ошибка при авторизации:', error);
        res.status(500).json({ success: false }); // Возвращаем только статус
    }
});

app.post('/register', async (req, res) => {
    const { email, password, fullname, idCard, group } = req.body;

    try {
        // Хэширование пароля
        const saltRounds = 10;
        const passwordHash = await bcrypt.hash(password, saltRounds);

        // Вставка данных в таблицу user
        const query = `
            INSERT INTO "user" (user_full_name, email, password, student_id_number, group_name)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING user_full_name, email, student_id_number, group_name
        `;
        const values = [fullname, email, passwordHash, idCard, group];

        const result = await pool.query(query, values);

        // Успешный ответ
        res.status(200).json({ success: true, message: 'Регистрация успешна' });
    } catch (error) {
        console.error('Ошибка при регистрации:', error);

        res.status(500).json({ success: false, message: 'Ошибка сервера при регистрации' });
    }
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


app.get('/api/email', async (req, res) => {
    try {
        const result = await pool.query('SELECT email FROM "user"');
        const emails = result.rows.map(row => row.email.trim());
        res.status(200).json({ success: true, emails });
    } catch (error) {
        console.error('Ошибка при получении списка email:', error);
        res.status(500).json({ success: false, message: 'Ошибка сервера при получении списка email' });
    }
});

// Endpoint для получения списка групп
app.get('/api/groups', async (req, res) => {
    try {
        // Запрос к базе данных для получения списка групп
        const result = await pool.query('SELECT group_name FROM "group"');
        const groups = result.rows.map(row => row.group_name.trim()); // Извлекаем названия групп
        res.status(200).json({ success: true, groups });
    } catch (error) {
        console.error('Ошибка при получении списка групп:', error);
        res.status(500).json({ success: false, message: 'Ошибка сервера при получении списка групп' });
    }
});

app.get('/api/id_number', async (req, res) => {
    try {
        // Запрос к базе данных для получения списка номеров студ билетов
        const result = await pool.query('SELECT student_id_number FROM "user"');
        const id_numbers = result.rows.map(row => row.student_id_number.trim()); // Извлекаем номера студ билетов
        res.status(200).json({ success: true, id_numbers });
    } catch (error) {
        console.error('Ошибка при получении списка номеров студ билетов:', error);
        res.status(500).json({ success: false, message: 'Ошибка сервера при получении списка номеров студ билетов' });
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
    const { book_name, author_full_name, year_of_publishing, udc_id, quantity } = req.body;

    try {
        await pool.query('BEGIN'); // Начинаем транзакцию

        // Получаем текущих авторов книги
        const oldAuthorsResult = await pool.query(`
            SELECT author_id FROM write WHERE book_id = $1;
        `, [bookId]);

        if (oldAuthorsResult.rows.length === 0) {
            await pool.query('ROLLBACK');
            return res.status(404).json({ message: 'Книга не найдена' });
        }

        const oldAuthorIds = oldAuthorsResult.rows.map(row => row.author_id);

        // Проверяем, существует ли новый автор
        let authorResult = await pool.query(`
            SELECT author_id FROM authors WHERE author_full_name = $1;
        `, [author_full_name]);

        let authorId;
        if (authorResult.rows.length === 0) {
            // Добавляем нового автора, если его нет
            const newAuthor = await pool.query(`
                INSERT INTO authors (author_full_name) VALUES ($1) RETURNING author_id;
            `, [author_full_name]);
            authorId = newAuthor.rows[0].author_id;
        } else {
            authorId = authorResult.rows[0].author_id;
        }

        // Обновляем книгу в literature (без изменения автора)
        const result = await pool.query(`
            UPDATE literature
            SET book_name = $1, year_of_publishing = $2, udc_id = $3, quantity = $4
            WHERE book_id = $5
            RETURNING *;
        `, [book_name, year_of_publishing, udc_id, quantity, bookId]);

        if (result.rows.length === 0) {
            await pool.query('ROLLBACK');
            return res.status(404).json({ message: 'Ошибка при обновлении книги' });
        }

        // Удаляем старые связи книги с авторами
        await pool.query(`
            DELETE FROM write WHERE book_id = $1;
        `, [bookId]);

        // Добавляем новую связь (если книга теперь принадлежит только одному автору)
        await pool.query(`
            INSERT INTO write (book_id, author_id) VALUES ($1, $2);
        `, [bookId, authorId]);

        // Проверяем, остались ли у старых авторов книги
        for (let oldAuthorId of oldAuthorIds) {
            const oldAuthorBooks = await pool.query(`
                SELECT COUNT(*) FROM write WHERE author_id = $1;
            `, [oldAuthorId]);

            if (parseInt(oldAuthorBooks.rows[0].count) === 0) {
                // Если книг не осталось, удаляем автора
                await pool.query(`
                    DELETE FROM authors WHERE author_id = $1;
                `, [oldAuthorId]);
            }
        }

        await reorderAuthors();

        await pool.query('COMMIT'); // Фиксируем транзакцию
        res.json(result.rows[0]);

    } catch (error) {
        await pool.query('ROLLBACK'); // Откатываем транзакцию при ошибке
        console.error('Ошибка при обновлении книги:', error);
        res.status(500).json({ message: 'Ошибка при обновлении книги' });
    }
});


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
    console.log("ID книги для удаления:", bookId);
    try {
        await pool.query('BEGIN');
        // Получаем всех авторов, связанных с удаляемой книгой
        const authorsResult = await pool.query('SELECT author_id FROM write WHERE book_id = $1', [bookId]);
        const authorIds = authorsResult.rows.map(row => row.author_id);
        console.log("Авторы для удаления:", authorIds);
        // Удаляем книгу из таблицы literature
        await pool.query('DELETE FROM literature WHERE book_id = $1', [bookId]);

        // Удаляем связи книги с авторами из таблицы writes
        await pool.query('DELETE FROM write WHERE book_id = $1', [bookId]);

        // Проверяем каждого автора, связанного с удаленной книгой
        for (const authorId of authorIds) {
            // Проверяем, есть ли у автора другие книги
            const booksByAuthor = await pool.query('SELECT COUNT(*) FROM write WHERE author_id = $1', [authorId]);
            const bookCount = parseInt(booksByAuthor.rows[0].count, 10);

            // Если у автора больше нет книг, удаляем его из таблицы authors
            if (bookCount === 0) {
                await pool.query('DELETE FROM authors WHERE author_id = $1', [authorId]);
            }
        }

        // Перенумерация оставшихся авторов
        await reorderBooks();
        await reorderAuthors();
        await pool.query('COMMIT');

        res.json({ message: 'Книга успешно удалена' });
    } catch (error) {
        await pool.query('ROLLBACK');
        console.error('Ошибка при удалении книги:', error);
        res.status(500).json({ message: 'Ошибка при удалении книги' });
    }
});

// Функция для перенумерации авторов
async function reorderAuthors() {
    await pool.query(`
        WITH reordered_authors AS (
            SELECT author_id, ROW_NUMBER() OVER (ORDER BY author_id) AS new_author_id
            FROM authors
        )
        UPDATE authors
        SET author_id = reordered_authors.new_author_id
        FROM reordered_authors
        WHERE authors.author_id = reordered_authors.author_id;
    `);

    // Сбрасываем последовательность для author_id
    await resetAuthorsSequence();
}

async function reorderBooks() {
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

    // Сбрасываем последовательность для book_id
    await resetLiteratureSequence();
}

// Запуск сервера
app.listen(PORT, () => {
    console.log(`Сервер запущен на http://localhost:${PORT}`);
});
