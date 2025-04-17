const express = require('express');
const router = express.Router();
const pool = require('../../database'); // Подключение к базе данных

// Обработчик для удаления пользователя
router.delete('/users/:student_id', async (req, res) => {
    const studentId = req.params.student_id;
    
    try {
        await pool.query('BEGIN');
        
        // Удаляем пользователя из таблицы users
        const deleteResult = await pool.query(
            'DELETE FROM "user" WHERE student_id_number = $1 RETURNING *', 
            [studentId]
        );
        
        if (deleteResult.rowCount === 0) {
            await pool.query('ROLLBACK');
            return res.status(404).json({ message: 'Пользователь не найден' });
        }
        
        await pool.query('COMMIT');
        
        res.json({ 
            message: 'Пользователь успешно удален',
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