// routes/user/update_user.js
const express = require('express');
const router = express.Router();
const pool = require('../../database');

router.put('/users/:email', async (req, res) => {
    const { email } = req.params;
    const { user_full_name, student_id_number, group_name, year_of_studying } = req.body;

    try {
        // 3. Обновление данных
        const result = await pool.query(`
            UPDATE "user" SET
                user_full_name = COALESCE($1, user_full_name),
                student_id_number = COALESCE($2, student_id_number),
                group_name = COALESCE($3, group_name),
                year_of_studying = COALESCE($4, year_of_studying)
            WHERE email = $5
            RETURNING *
        `, [user_full_name, student_id_number, group_name, year_of_studying, email]);

        res.json(result.rows[0]);

    } catch (error) {
        console.error('Ошибка обновления:', error);
        res.status(500).json({ message: 'Внутренняя ошибка сервера' });
    }
});

module.exports = router;