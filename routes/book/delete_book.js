const express = require('express');
const router = express.Router();
const pool = require('../../database'); // Подключение к базе данных
const { reorderAuthors } = require('../../utils/reorderAuthors');
const { reorderBooks } = require('../../utils/reorderLiterature');

// Обработчик для удаления книги
router.delete('/books/:id', async (req, res) => {
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

module.exports = router;