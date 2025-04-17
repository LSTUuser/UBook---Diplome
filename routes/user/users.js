const express = require('express');
const router = express.Router();
const pool = require('../../database'); // Подключение к базе данных

// Получение списка книг
router.get('/users', async (req, res) => {
    try {
        const result = await pool.query(`
        SELECT
            user_full_name,
            email,
            student_id_number,
            group_name,
            year_of_studying
        FROM 
            "user"
        WHERE
            is_admin = false
        ORDER BY email ASC;
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