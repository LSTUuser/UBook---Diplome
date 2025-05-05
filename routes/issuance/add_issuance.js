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

        const issuance = result.rows[0];
        console.log("Выдача добавлена:", issuance);

        // 2. Добавление уведомления
        await pool.query(`
            INSERT INTO notification (issuance_id, email, return_date, is_read)
            VALUES ($1, $2, $3, FALSE);
        `, [issuance.issuance_id, issuance.email, issuance.return_date]);

        console.log("Уведомление добавлено для:", issuance.email);

        res.json(issuance);
    } catch (error) {
        console.error('Ошибка при добавлении выдачи:', error);
        res.status(500).json({ message: 'Ошибка при добавлении выдачи' });
    }
});

module.exports = router;