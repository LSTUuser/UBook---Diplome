const express = require('express');
const router = express.Router();
const pool = require('../../database');
const { resetAuthorsSequence } = require('../../utils/reorderAuthors');
const { resetLiteratureSequence } = require('../../utils/reorderLiterature');

// Добавление книги
router.post('/books', async (req, res) => {
    const { book_name, author_full_name, year_of_publishing, udc_id, quantity } = req.body;

    try {
        console.log("Данные для добавления книги:", req.body);

        // Проверка на наличие UDC
        const udcResult = await pool.query('SELECT 1 FROM udc WHERE udc_id = $1', [udc_id]);
        if (udcResult.rowCount === 0) {
            return res.status(400).json({ message: 'УДК не найдено' });
        }

        // Вставка новой книги в таблицу
        const result = await pool.query(`
            INSERT INTO literature (book_name, year_of_publishing, udc_id, quantity, available)
            VALUES ($1, $2, $3, $4, true)
            RETURNING book_id, book_name, year_of_publishing, udc_id, quantity, available;
        `, [book_name, year_of_publishing, udc_id, quantity]);

        // Перестройка последовательности для книг
        await resetLiteratureSequence();

        console.log("Книга добавлена:", result.rows[0]);

        // Вставляем автора, если его еще нет
        const authorResult = await pool.query(`
            INSERT INTO authors (author_full_name) 
            VALUES ($1) 
            ON CONFLICT (author_full_name) DO NOTHING
            RETURNING author_id;
        `, [author_full_name]);

        // Перестройка последовательности для авторов
        await resetAuthorsSequence();

        let authorId;

        if (authorResult.rows.length === 0) {
            // Если автор уже существует, получаем его ID
            const existingAuthor = await pool.query(`
                SELECT author_id FROM authors WHERE author_full_name = $1;
            `, [author_full_name]);
            authorId = existingAuthor.rows[0].author_id;
        } else {
            // Если автор был добавлен, используем его ID
            authorId = authorResult.rows[0].author_id;
        }

        console.log("Автор добавлен или найден:", authorId);

        // Соединяем книгу с автором
        if (authorId) {
            await pool.query(`
                INSERT INTO write (book_id, author_id) 
                VALUES ($1, $2);
            `, [result.rows[0].book_id, authorId]);
            console.log("Книга и автор связаны");
        }

        // 1. Получаем название UDC для семантического сравнения
        const udcInfo = await pool.query('SELECT udc_name FROM udc WHERE udc_id = $1', [udc_id]);
        const udcName = udcInfo.rows[0].udc_name;

        // 3. Сравниваем с помощью модели (через API)
        const compareResponse = await fetch('http://localhost:3000/api/compare-texts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                text1: udcName,
            })
        });

        if (!compareResponse.ok) {
            throw new Error('Ошибка при вызове API сравнения текстов');
        }

        const topMatches = await compareResponse.json();
        const bestSubject = topMatches[0]; // первый из top-5
        const similarityScore = bestSubject.score;

        console.log(similarityScore);
        // 6. Назначение только если сходство > 0.7
        if (similarityScore >= 0.7) {
            // Получаем специальности для этой дисциплины
            const specialities = await pool.query(
                'SELECT DISTINCT speciality_id FROM educational_period WHERE subject_id = $1',
                [bestSubject.subject_id]
            );
            // Добавляем записи в assigned_literature
            for (const spec of specialities.rows) {
                await pool.query(`
                INSERT INTO assigned_literature (book_id, speciality_id, subject_id)
                VALUES ($1, $2, $3)
            `, [result.rows[0].book_id, spec.speciality_id, bestSubject.subject_id]);
            }

            console.log(`Книга назначена: ${bestSubject.subject_name} (сходство: ${similarityScore.toFixed(2)})`);
        } else {
            console.log(`Не найдено подходящих дисциплин (макс. сходство: ${similarityScore.toFixed(2)})`);
        }

        res.json({
            ...result.rows[0],
            assigned_subject: similarityScore >= 0.7 ? bestSubject.subject_name : null,
            similarity_score: similarityScore
        });

    } catch (error) {
        console.error('Ошибка при добавлении книги:', error);
        res.status(500).json({ message: 'Ошибка при добавлении книги' });
    }
});

module.exports = router;