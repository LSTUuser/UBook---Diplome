const express = require('express');
const router = express.Router();
const pool = require('../../database'); // Подключение к базе данных

// Проверка УДК
router.get('/udc_id/:udc_id', async (req, res) => {
    const { udc_id } = req.params;

    try {
        const result = await pool.query('SELECT 1 FROM udc WHERE udc_id = $1', [udc_id]);

        if (result.rowCount > 0) {
            return res.status(200).json({ message: 'УДК найдено' });
        } else {
            return res.status(404).json({ message: 'УДК не найдено' });
        }
    } catch (error) {
        console.error('Ошибка при проверке УДК:', error);
        res.status(500).json({ message: 'Ошибка при проверке УДК' });
    }
});

module.exports = router;