const express = require('express');
const router = express.Router();
const pool = require('../../database'); // Подключение к базе данных

// Обработчик для удаления пользователя
router.delete('/issuances/:id', async (req, res) => {
    const issuanceId = req.params.id;
    
    try {
        await pool.query('BEGIN');
        
        // Удаляем пользователя из таблицы users
        const deleteResult = await pool.query(
            'DELETE FROM issuance WHERE issuance_id = $1 RETURNING *', 
            [issuanceId]
        );
        
        if (deleteResult.rowCount === 0) {
            await pool.query('ROLLBACK');
            return res.status(404).json({ message: 'Выдача не найдена' });
        }
        
        await pool.query('COMMIT');
        
        res.json({ 
            message: 'Выдача успешно удалена',
            deletedUser: deleteResult.rows[0]
        });
        
    } catch (error) {
        await pool.query('ROLLBACK');
        console.error('Ошибка при удалении пользователя:', error);
        res.status(500).json({ 
            message: 'Ошибка при удалении пользователя',
            error: error.message
        });
    }
});

module.exports = router;