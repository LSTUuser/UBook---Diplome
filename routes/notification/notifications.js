const express = require('express');
const router = express.Router();
const pool = require('../../database');
const { authenticateJWT } = require('../auth');

// Получение уведомлений для авторизованного пользователя
router.get('/notifications', authenticateJWT, async (req, res) => {
    const { email } = req.user;

    try {
        const result = await pool.query(`
            SELECT n.issuance_id, n.email, n.return_date, n.is_read, l.book_name
            FROM notification n
            JOIN issuance i ON n.issuance_id = i.issuance_id
            JOIN literature l ON i.book_id = l.book_id
            WHERE n.email = $1
            ORDER BY n.is_read ASC
        `, [email]);

        res.json(result.rows);
    } catch (err) {
        console.error('Ошибка при получении уведомлений:', err);
        res.status(500).json({ message: 'Ошибка при получении уведомлений' });
    }
});

router.put('/notifications/:id/read', authenticateJWT, async (req, res) => {
    const { id } = req.params;
    const { email } = req.user;

    try {
        await pool.query(`
            UPDATE notification
            SET is_read = TRUE
            WHERE issuance_id = $1 AND email = $2;
        `, [id, email]);

        res.json({ success: true });
    } catch (err) {
        console.error('Ошибка при обновлении статуса уведомления:', err);
        res.status(500).json({ message: 'Ошибка сервера' });
    }
});

module.exports = router;