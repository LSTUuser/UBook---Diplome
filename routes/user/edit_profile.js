const express = require('express');
const router = express.Router();
const pool = require('../../database');
const { authenticateJWT } = require('../auth');

// Получение данных профиля
router.get('/profile', authenticateJWT, async (req, res) => {
    try {
        const { email } = req.user;
        
        const result = await pool.query(`
            SELECT user_full_name, student_id_number, TRIM(group_name) AS group_name
            FROM "user"
            WHERE email = $1
        `, [email]);

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Пользователь не найден' });
        }

        res.json({
            success: true,
            user: {
                fullName: result.rows[0].user_full_name,
                idCard: result.rows[0].student_id_number,
                group: result.rows[0].group_name
            }
        });
    } catch (error) {
        console.error('Ошибка при получении профиля:', error);
        res.status(500).json({ success: false, message: 'Ошибка сервера' });
    }
});

// Обновление профиля
router.post('/update_profile', authenticateJWT, async (req, res) => {
    try {
        const { email } = req.user;
        const { fullname, idCard, group } = req.body;

        // Проверка существования группы
        const groupCheck = await pool.query(
            'SELECT EXISTS(SELECT 1 FROM "group" WHERE group_name = $1)', 
            [group]
        );
        
        if (!groupCheck.rows[0].exists) {
            return res.status(400).json({ success: false, message: 'Указанная группа не существует' });
        }

        // Обновление данных
        await pool.query(`
            UPDATE "user"
            SET user_full_name = $1, student_id_number = $2, group_name = $3
            WHERE email = $4
        `, [fullname, idCard, group, email]);

        res.json({ success: true, message: 'Данные успешно обновлены' });
    } catch (error) {
        console.error('Ошибка при обновлении профиля:', error);
        res.status(500).json({ success: false, message: 'Ошибка сервера' });
    }
});

module.exports = router;