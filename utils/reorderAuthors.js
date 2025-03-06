const pool = require('../database'); // Подключение к базе данных

// Функция для перестройки последовательности авторов
async function resetAuthorsSequence() {
    await pool.query(`
        SELECT setval('authors_author_id_seq', 
            (SELECT COALESCE(MAX(author_id), 0) FROM authors));
    `);
}

// Функция для перенумерации авторов
async function reorderAuthors() {
    await pool.query(`
        WITH reordered_authors AS (
            SELECT author_id, ROW_NUMBER() OVER (ORDER BY author_id) AS new_author_id
            FROM authors
        )
        UPDATE authors
        SET author_id = reordered_authors.new_author_id
        FROM reordered_authors
        WHERE authors.author_id = reordered_authors.author_id;
    `);

    // Сбрасываем последовательность для author_id
    await resetAuthorsSequence();
}

module.exports = {
    reorderAuthors,
    resetAuthorsSequence,
};