const express = require('express');
const router = express.Router();
const pool = require('../../database');

// GET /api/book/udcs/search?query=текст&page=1
router.get('/search', async (req, res) => {
    try {
        const { query = '' } = req.query; // Убираем пагинацию для Select2
        
        const result = await pool.query(
            `SELECT udc_id FROM udc 
             WHERE udc_id ILIKE $1
             `, // Фиксированный лимит
            [`%${query}%`]
        );

        res.json(result.rows); // Просто массив объектов {udc_id}
    } catch (error) {
        console.error('Ошибка поиска УДК:', error);
        res.status(500).json({ message: 'Ошибка сервера' });
    }
});

module.exports = router;