const express = require('express');
const router = express.Router();
const pool = require('../../database'); // Подключение к базе данных

// Получение списка книг
router.get('/issuances', async (req, res) => {
    try {
        const result = await pool.query(`
        SELECT
            i.issuance_id,
            i.issuance_date,
            i.return_date,
            i.return_period,
            u.user_full_name,
            u.email,
            u.student_id_number,
            u.group_name,
            u.year_of_studying,
            l.book_name,
            a.author_full_name,
            l.year_of_publishing,
            l.udc_id,
            udc.udc_name
        FROM issuance i
        JOIN "user" u ON i.email = u.email
        JOIN literature l ON i.book_id = l.book_id
		JOIN write w ON l.book_id = w.book_id
		JOIN authors a ON w.author_id = a.author_id
        JOIN udc ON l.udc_id = udc.udc_id
        ORDER BY i.issuance_id ASC;
        `);
        res.json(result.rows);
    } catch (error) {
        console.error('Ошибка при получении пользователей:', error);
        res.status(500).json({
            message: 'Ошибка сервера',
            error: error.message,
            stack: error.stack
        });
    }
});


module.exports = router;