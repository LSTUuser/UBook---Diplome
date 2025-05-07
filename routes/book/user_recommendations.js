const express = require('express');
const router = express.Router();
const pool = require('../../database');
const { authenticateJWT } = require('../../routes/auth');

// Получение рекомендованных книг для текущего пользователя
router.get('/user_recommendations', authenticateJWT, async (req, res) => {
    const { group } = req.user; // Получаем group_name из JWT токена

    try {
        // 1. Сначала получаем speciality_id для группы пользователя
        const groupInfo = await pool.query(
            'SELECT speciality_id FROM "group" WHERE group_name = $1', 
            [group]
        );

        if (groupInfo.rows.length === 0) {
            return res.status(404).json({ message: 'Группа не найдена' });
        }

        const speciality_id = groupInfo.rows[0].speciality_id;

        // 2. Затем получаем рекомендованные книги для этой специальности
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
                s.subject_name,
                sp.speciality_name
            FROM 
                assigned_literature al
            JOIN 
                literature l ON al.book_id = l.book_id
            JOIN 
                write w ON l.book_id = w.book_id
            JOIN 
                authors a ON w.author_id = a.author_id
            JOIN 
                udc u ON l.udc_id = u.udc_id
            JOIN
                subjects s ON al.subject_id = s.subject_id
            JOIN
                speciality sp ON al.speciality_id = sp.speciality_id
            WHERE 
                al.speciality_id = $1
            ORDER BY 
                l.book_id DESC;
        `, [speciality_id]);

        res.json(result.rows);
    } catch (error) {
        console.error('Ошибка при получении рекомендованных книг:', error);
        res.status(500).json({
            message: 'Ошибка сервера',
            error: error.message,
            stack: error.stack
        });
    }
});

module.exports = router;