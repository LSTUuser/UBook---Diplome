const express = require('express');
const router = express.Router();
const pool = require('../../database');

// GET /api/book/udcs/search?query=текст&page=1
router.get('/search', async (req, res) => {
    try {
        const { query = '', page = 1 } = req.query;
        const limit = 20;
        const offset = (page - 1) * limit;

        // Поиск УДК с пагинацией
        const result = await pool.query(
            `SELECT udc_id FROM udc 
             WHERE udc_id ILIKE $1
             ORDER BY udc_id
             LIMIT $2 OFFSET $3`,
            [`%${query}%`, limit, offset]
        );

        // Получаем общее количество для пагинации
        const countResult = await pool.query(
            `SELECT COUNT(*) FROM udc WHERE udc_id ILIKE $1`,
            [`%${query}%`]
        );

        res.json({
            items: result.rows,
            total: parseInt(countResult.rows[0].count),
            page: parseInt(page),
            limit,
            hasMore: (page * limit) < parseInt(countResult.rows[0].count)
        });
    } catch (error) {
        console.error('Ошибка поиска УДК:', error);
        res.status(500).json({ message: 'Ошибка сервера' });
    }
});

module.exports = router;