const express = require('express');
const router = express.Router();
const pool = require('../../database'); // Подключение к базе данных

router.get('/id_number', async (req, res) => {
    try {
        // Запрос к базе данных для получения списка номеров студ билетов
        const result = await pool.query('SELECT student_id_number FROM "user"');
        const id_numbers = result.rows
        .map(row => row.student_id_number ? row.student_id_number.trim() : null)
        .filter(id => id !== null); // Убираем null из итогового списка
        res.status(200).json({ success: true, id_numbers });
    } catch (error) {
        console.error('Ошибка при получении списка номеров студ билетов:', error);
        res.status(500).json({ success: false, message: 'Ошибка сервера при получении списка номеров студ билетов' });
    }
});

module.exports = router;