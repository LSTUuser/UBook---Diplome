const pool = require('../database'); // Подключение к базе данных

// Функция для перестройки последовательности книг
async function resetLiteratureSequence() {
    await pool.query(`
        SELECT setval('literature_book_id_seq', 
            (SELECT COALESCE(MAX(book_id), 0) FROM literature));
    `);
}

async function reorderBooks() {
    await pool.query(`
        WITH reordered_books AS (
            SELECT book_id
            FROM literature
            ORDER BY book_id
        )
        UPDATE literature
        SET book_id = reordered_books.row_number
        FROM (
            SELECT book_id, ROW_NUMBER() OVER (ORDER BY book_id) AS row_number
            FROM literature
        ) AS reordered_books
        WHERE literature.book_id = reordered_books.book_id;
    `);

    // Сбрасываем последовательность для book_id
    await resetLiteratureSequence();
}

module.exports = {
    reorderBooks,
    resetLiteratureSequence,
};