const tf = require('@tensorflow/tfjs-node');
const use = require('@tensorflow-models/universal-sentence-encoder');
const pool = require('../database');

let model;

// Загрузка модели при старте сервера
async function loadModel() {
  model = await use.load();
  console.log('Модель загружена');
}

// Рекомендация предметов для UDK
async function recommendSubjects(udkName) {
  if (!model) await loadModel();

  // 1. Получаем все предметы из БД
  const { rows: subjects } = await pool.query(`
    SELECT s.subject_id, s.subject_name, ep.speciality_id, ep.year_of_studying
    FROM subjects s
    JOIN educational_period ep ON s.subject_id = ep.subject_id
  `);

  // 2. Векторизируем UDK и предметы
  const udkEmbedding = await model.embed([udkName]);
  const subjectEmbeddings = await model.embed(subjects.map(s => s.subject_name));

  // 3. Считаем косинусную схожесть
  const similarities = tf.tidy(() => {
    const udkTensor = udkEmbedding.arraySync()[0];
    return subjectEmbeddings.arraySync().map((subjectVec, i) => ({
      subject: subjects[i],
      score: tf.dot(udkTensor, subjectVec).dataSync()[0]
    }));
  });

  // 4. Выбираем топ-3 предмета
  return similarities
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .filter(item => item.score > 0.3); // Порог схожести
}

module.exports = { loadModel, recommendSubjects };