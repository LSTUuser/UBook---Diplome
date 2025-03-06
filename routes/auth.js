const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const pool = require('../database'); // Подключение к базе данных

// Роут для логина
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        const userResult = await pool.query('SELECT * FROM "user" WHERE email = $1', [email]);

        if (userResult.rows.length === 0) {
            return res.status(401).json({ success: false });
        }

        const user = userResult.rows[0];
        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            return res.status(401).json({ success: false });
        }

        res.status(200).json({
            success: true,
            user: {
                id: user.id,
                username: user.username,
                email: user.email
            }
        });
    } catch (error) {
        console.error('Ошибка при авторизации:', error);
        res.status(500).json({ success: false });
    }
});

// Роут для регистрации
router.post('/register', async (req, res) => {
    const { email, password, fullname, idCard, group } = req.body;

    try {
        const saltRounds = 10;
        const passwordHash = await bcrypt.hash(password, saltRounds);

        const query = `
            INSERT INTO "user" (user_full_name, email, password, student_id_number, group_name)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING user_full_name, email, student_id_number, group_name
        `;
        const values = [fullname, email, passwordHash, idCard, group];

        const result = await pool.query(query, values);
        res.status(200).json({ success: true, message: 'Регистрация успешна' });
    } catch (error) {
        console.error('Ошибка при регистрации:', error);
        res.status(500).json({ success: false, message: 'Ошибка сервера при регистрации' });
    }
});

module.exports = router;