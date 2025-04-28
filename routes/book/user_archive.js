const express = require('express');
const router = express.Router();
const pool = require('../../database');
const { authenticateJWT } = require('../../routes/auth');

// Получение списка книг для текущего пользователя
router.get('/user_archive', authenticateJWT, async (req, res) => {
    const { email } = req.user; 
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
                a.author_full_name,
                i.issuance_date,
                i.return_date,
                i.return_period
            FROM 
                literature l
            JOIN 
                write w ON l.book_id = w.book_id
            JOIN 
                authors a ON w.author_id = a.author_id
            JOIN 
                udc u ON l.udc_id = u.udc_id
            JOIN
                issuance i ON l.book_id = i.book_id
            WHERE
                i.email = $1 AND i.return_period IS NOT NULL
            ORDER BY l.book_id DESC;
        `, [email]);
        
        res.json(result.rows);
    } catch (error) {
        console.error('Ошибка при получении книг:', error);
        res.status(500).json({
            message: 'Ошибка сервера',
            error: error.message
        });
    }
});

module.exports = router;