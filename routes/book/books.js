const express = require('express');
const router = express.Router();
const pool = require('../../database'); // Подключение к базе данных

// Получение списка книг
// routes\book\books.js
router.get('/books', async (req, res) => {
    try {
        const { 
            page = 1, 
            limit = 10,
            search = '',
            author = '',
            category = '',
            year = '',
            udk = ''
        } = req.query;

        const offset = (page - 1) * limit;

        // Базовый запрос
        let query = `
            SELECT
                l.book_id,
                l.udc_id, 
                w.author_id,
                l.book_name,
                l.year_of_publishing,
                u.udc_name, 
                l.quantity,
                l.available,
                a.author_full_name
            FROM 
                literature l
            JOIN 
                write w ON l.book_id = w.book_id
            JOIN 
                authors a ON w.author_id = a.author_id
            JOIN 
                udc u ON l.udc_id = u.udc_id
            WHERE 1=1
        `;

        const params = [];
        let paramIndex = 1;

        // Добавляем условия поиска и фильтрации
        if (search) {
            query += ` AND l.book_name ILIKE $${paramIndex}`;
            params.push(`%${search}%`);
            paramIndex++;
        }

        if (author) {
            query += ` AND a.author_full_name ILIKE $${paramIndex}`;
            params.push(`%${author}%`);
            paramIndex++;
        }

        if (category) {
            query += ` AND u.udc_name ILIKE $${paramIndex}`;
            params.push(`%${category}%`);
            paramIndex++;
        }

        if (year) {
            query += ` AND l.year_of_publishing = $${paramIndex}`;
            params.push(year);
            paramIndex++;
        }

        if (udk) {
            query += ` AND l.udc_id ILIKE $${paramIndex}`;
            params.push(`%${udk}%`);
            paramIndex++;
        }

        query += ` ORDER BY l.book_id DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
        params.push(limit, offset);

        // Запрос для книг
        const booksResult = await pool.query(query, params);

        // Запрос для общего количества (с теми же фильтрами)
        let countQuery = `
            SELECT COUNT(*) 
            FROM literature l
            JOIN write w ON l.book_id = w.book_id
            JOIN authors a ON w.author_id = a.author_id
            JOIN udc u ON l.udc_id = u.udc_id
            WHERE 1=1
        `;

        const countParams = [];
        paramIndex = 1;

        if (search) {
            countQuery += ` AND l.book_name ILIKE $${paramIndex}`;
            countParams.push(`%${search}%`);
            paramIndex++;
        }

        if (author) {
            countQuery += ` AND a.author_full_name ILIKE $${paramIndex}`;
            countParams.push(`%${author}%`);
            paramIndex++;
        }

        if (category) {
            countQuery += ` AND u.udc_name ILIKE $${paramIndex}`;
            countParams.push(`%${category}%`);
            paramIndex++;
        }

        if (year) {
            countQuery += ` AND l.year_of_publishing = $${paramIndex}`;
            countParams.push(year);
            paramIndex++;
        }

        if (udk) {
            countQuery += ` AND l.udc_id ILIKE $${paramIndex}`;
            countParams.push(`%${udk}%`);
            paramIndex++;
        }

        const countResult = await pool.query(countQuery, countParams);
        const totalCount = parseInt(countResult.rows[0].count);

        res.json({
            success: true,
            data: booksResult.rows,
            pagination: {
                total: totalCount,
                totalPages: Math.ceil(totalCount / limit),
                currentPage: parseInt(page),
                limit: parseInt(limit)
            }
        });

    } catch (error) {
        console.error('Ошибка при получении книг:', error);
        res.status(500).json({
            success: false,
            message: 'Ошибка сервера'
        });
    }
});

module.exports = router;