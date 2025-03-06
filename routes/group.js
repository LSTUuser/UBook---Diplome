const express = require('express');
const router = express.Router();
const pool = require('../database'); // Подключение к базе данных

// Endpoint для получения списка групп
router.get('/groups', async (req, res) => {
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

module.exports = router;