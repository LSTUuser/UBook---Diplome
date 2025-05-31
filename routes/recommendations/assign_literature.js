const express = require('express');
const router = express.Router();
const tf = require('@tensorflow/tfjs');
const use = require('@tensorflow-models/universal-sentence-encoder');
const { getModel } = require('../../modelLoader');
const pool = require('../../database');

async function translateRussianToEnglish(text) {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=ru&tl=en&dt=t&q=${encodeURIComponent(text)}`;

    try {
        const response = await fetch(url);
        const data = await response.json();
        return data[0].map(item => item[0]).join('');
    } catch (error) {
        console.error('Ошибка перевода:', error);
        return text;
    }
}

// POST /api/compare-texts
router.post('/compare-texts', async (req, res) => {
    try {
        console.log("Получен запрос на сравнение текстов.");
        const model = getModel();

        const { text1 } = req.body;
        if (!text1) {
            console.error("Некорректные входные данные: отсутствует text1");
            return res.status(400).json({ error: 'Некорректные входные данные' });
        }

        // Переводим текст перед сравнением
        console.log(`Перевод текста "${text1}" с русского на английский...`);
        const translatedText = await translateRussianToEnglish(text1);
        console.log(`Перевод завершен: "${text1}" → "${translatedText}"`);

        const { rows: subjects } = await pool.query(
            'SELECT subject_id, subject_name, embedding FROM subjects WHERE embedding IS NOT NULL'
        );

        if (subjects.length === 0) {
            return res.status(404).json({ error: 'В базе нет дисциплин с эмбеддингами' });
        }

        const subjectNames = subjects.map(s => s.subject_name);
        console.log(`Начато сравнение текста "${translatedText}" с ${subjectNames.length} дисциплинами из базы данных`);

        const startTime = Date.now();
        const logInterval = 500;
        let lastLogged = 0;

        // Получаем эмбеддинг только для text1
        const embeddingTensor = await model.embed([translatedText]);
        const embeddingsArray = embeddingTensor.arraySync();
        const mainEmbedding = embeddingsArray[0];

        // Векторизованное сравнение
        const tfMain = tf.tensor2d([mainEmbedding]); // [1, dim]
        const tfSubjects = tf.tensor2d(subjects.map(s => s.embedding)); // [N, dim]

        // Косинусные расстояния: dot(a, b) / (||a|| * ||b||)
        const dotProducts = tf.matMul(tfSubjects, tfMain, false, true).arraySync(); // [N, 1]

        const mainNorm = Math.sqrt(mainEmbedding.reduce((sum, val) => sum + val * val, 0));
        const subjectNorms = subjects.map(s => Math.sqrt(s.embedding.reduce((sum, val) => sum + val * val, 0)));

        const results = dotProducts.map((dp, i) => dp[0] / (mainNorm * subjectNorms[i]));

        console.log(`Обработано ${subjects.length} дисциплин за ${(Date.now() - startTime) / 1000} сек.`);


        const totalTime = ((Date.now() - startTime) / 1000).toFixed(1);
        console.log(`Сравнение завершено за ${totalTime} секунд`);

        // Топ-5 наиболее похожих дисциплин
        const topResults = subjects.map((subject, index) => ({
            subject_id: subject.subject_id,
            subject_name: subject.subject_name,
            original_text: text1,
            translated_text: translatedText,
            score: results[index]
        })).sort((a, b) => b.score - a.score).slice(0, 5);

        console.log("Топ-5 наиболее подходящих дисциплин:");
        topResults.forEach((item, i) => {
            console.log(`${i + 1}. "${item.subject_name}" - сходство: ${item.score.toFixed(4)}`);
        });

        res.json(topResults);
    } catch (err) {
        console.error('Ошибка при сравнении текстов:', err);
        res.status(500).json({ error: 'Ошибка при сравнении текстов' });
    }
});

module.exports = router;