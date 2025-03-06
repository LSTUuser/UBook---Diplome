const express = require('express');
const router = express.Router();
const pool = require('../../database'); // Подключение к базе данных
const { reorderAuthors } = require('../../utils/reorderAuthors');

router.put('/books/:id', async (req, res) => {
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

module.exports = router;