const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const pool = require('../database'); // Подключение к базе данных
const jwt = require('jsonwebtoken');
require('dotenv').config(); // Загружает переменные из .env
const JWT_SECRET = process.env.JWT_SECRET;

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

        // Создаем JWT токен
        const token = jwt.sign(
            { 
                sub: user.email,
                studentId: user.student_id_number,
                group: user.group_name,
                is_admin: user.is_admin,
                fullName: user.user_full_name,
                email: user.email,
                iat: Math.floor(Date.now() / 1000),
            }, 
            JWT_SECRET,
            { expiresIn: '1h' }
        );

        console.log('Выдан токен:', {
            token: token,
            decoded: jwt.decode(token),
            expires: new Date(Date.now() + 3600000)
          });

         // Устанавливаем токен в HTTP-only cookie
         res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production' ? true : false, // В продакшене используем secure
            maxAge: 3600000 // 1 час в миллисекундах
        });

        res.status(200).json({
            success: true,
            user: {
                fullName: user.user_full_name,
                email: user.email,
                is_admin: user.is_admin
            }
        });
    } catch (error) {
        console.error('Ошибка при авторизации:', error);
        res.status(500).json({ success: false });
    }
});

// Добавьте middleware для проверки JWT
const authenticateJWT = (req, res, next) => {
    const token = req.cookies.token;

    if (token) {
        jwt.verify(token, JWT_SECRET, (err, user) => {
            if (err) {
                console.error('Ошибка JWT:', err);
                return res.sendStatus(403);
            }
            req.user = user;
            next();
        });
    } else {
        res.sendStatus(401);
    }
};

router.get('/check', authenticateJWT, (req, res) => {
    res.json({
        isAuthenticated: true,
        user: {
            email: req.user.email,
            is_admin: req.user.is_admin, // Добавляем информацию о роли
            fullName: req.user.fullName,
            group: req.user.group
        }
    });
});

router.post('/logout', (req, res) => {
    const token = req.cookies.token;
    
    // Полное удаление cookie со всеми параметрами
    res.clearCookie('token', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/',
        domain: 'localhost'
    });
    
    res.cookie('token', '', {
        expires: new Date(0),
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/',
        domain: 'localhost'
    });

    return res.status(204).end();
});

// Роут для регистрации
router.post('/register', async (req, res) => {
    const { email, password, fullname, idCard, group, year} = req.body;

    try {
        const saltRounds = 10;
        const passwordHash = await bcrypt.hash(password, saltRounds);

        const query = `
            INSERT INTO "user" (user_full_name, email, password, student_id_number, group_name, year_of_studying)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING user_full_name, email, student_id_number, group_name, year_of_studying
        `;
        const values = [fullname, email, passwordHash, idCard, group, year];

        const result = await pool.query(query, values);
        res.status(200).json({ success: true, message: 'Регистрация успешна' });
    } catch (error) {
        console.error('Ошибка при регистрации:', error);
        res.status(500).json({ success: false, message: 'Ошибка сервера при регистрации' });
    }
});

module.exports = router;
module.exports.authenticateJWT = authenticateJWT;