const express = require('express');
const router = express.Router();
const pool = require('../../database'); // Подключение к базе данных

// Получение списка книг
router.get('/us_books', async (req, res) => {
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
            l.available,
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

module.exports = router;