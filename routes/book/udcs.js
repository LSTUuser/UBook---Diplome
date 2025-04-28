const express = require('express');
const router = express.Router();
const pool = require('../../database');

// Получение списка УДК (без поиска)
router.get('/', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const offset = (page - 1) * limit;

        const result = await pool.query(
            'SELECT udc_id FROM udc ORDER BY udc_id LIMIT $1 OFFSET $2', 
            [limit, offset]
        );

        const countResult = await pool.query('SELECT COUNT(*) FROM udc');
        
        res.json({
            items: result.rows,
            total: parseInt(countResult.rows[0].count),
            page,
            limit,
            hasMore: (page * limit) < parseInt(countResult.rows[0].count)
        });
    } catch (error) {
        console.error('Ошибка:', error);
        res.status(500).json({ message: 'Ошибка сервера' });
    }
});

module.exports = router;