const express = require('express');
const router = express.Router();
const pool = require('../database'); // Подключение к базе данных

router.get('/email', async (req, res) => {
    try {
        const result = await pool.query('SELECT email FROM "user"');
        const emails = result.rows.map(row => row.email.trim());
        res.status(200).json({ success: true, emails });
    } catch (error) {
        console.error('Ошибка при получении списка email:', error);
        res.status(500).json({ success: false, message: 'Ошибка сервера при получении списка email' });
    }
});

module.exports = router;