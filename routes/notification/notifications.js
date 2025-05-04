const express = require('express');
const router = express.Router();
const pool = require('../../database');
const { authenticateJWT } = require('../../routes/auth');

// Получение уведомлений для текущего пользователя
router.get('/notifications', authenticateJWT, async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT n.*, l.book_name, i.return_date
            FROM notification n
            JOIN issuance i ON n.issuance_id = i.issuance_id
            JOIN literature l ON i.book_id = l.book_id
            WHERE n.email = $1
            ORDER BY 
                CASE WHEN n.type = 'overdue' THEN 0 ELSE 1 END,
                i.return_date ASC
        `, [req.user.email]);
        
        res.json(result.rows);
    } catch (error) {
        console.error('Ошибка при получении уведомлений:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;