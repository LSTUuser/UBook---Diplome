const express = require('express');
const router = express.Router();
const pool = require('../../database');

// Добавление книги
router.post('/issuances', async (req, res) => {
    const { book_id, email, issuance_date, return_date } = req.body;

    try {
        console.log("Данные для добавления выдачи:", req.body);

        // Вставка новой книги в таблицу
        const result = await pool.query(`
            INSERT INTO issuance (book_id, email, issuance_date, return_date)
            VALUES ($1, $2, $3, $4)
            RETURNING issuance_id, book_id, email, issuance_date, return_date;
        `, [book_id, email, issuance_date, return_date]);

        console.log("Выдача добавлена:", result.rows[0]);

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Ошибка при добавлении выдачи:', error);
        res.status(500).json({ message: 'Ошибка при добавлении выдачи' });
    }
});

module.exports = router;