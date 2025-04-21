const express = require('express');
const router = express.Router();
const pool = require('../../database'); // Подключение к базе данных

// Обновление даты возврата для выдачи
router.put('/issuances/:id/return', async (req, res) => {
    const issuanceId = req.params.id;
    const { return_period } = req.body;

    try {
        await pool.query('BEGIN');

        const updateResult = await pool.query(
            'UPDATE issuance SET return_period = $1 WHERE issuance_id = $2 RETURNING *',
            [return_period, issuanceId]
        );

        if (updateResult.rowCount === 0) {
            await pool.query('ROLLBACK');
            return res.status(404).json({ message: 'Выдача не найдена' });
        }

        await pool.query('COMMIT');

        res.json({ 
            message: 'Дата возврата успешно обновлена',
            updatedIssuance: updateResult.rows[0]
        });

    } catch (error) {
        await pool.query('ROLLBACK');
        console.error('Ошибка при обновлении даты возврата:', error);
        res.status(500).json({ 
            message: 'Ошибка при обновлении даты возврата',
            error: error.message
        });
    }
});

module.exports = router;
