const express = require('express');
const router = express.Router();
const pool = require('../../database'); // Подключение к базе данных

router.get('/udc_name', async (req, res) => {
    const { id } = req.query;
    const result = await pool.query('SELECT udc_name FROM udc WHERE udc_id = $1', [id]);
    res.json(result.rows[0] || { name: '' });
});

module.exports = router;