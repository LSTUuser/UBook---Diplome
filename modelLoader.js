const use = require('@tensorflow-models/universal-sentence-encoder');

let model = null;

async function loadModel() {
    if (!model) {
        console.log("Загружаем модель USE...");
        model = await use.load();
        console.log("Модель USE успешно загружена.");
    }
    return model;
}

function getModel() {
    if (!model) {
        throw new Error("Модель не загружена. Сначала вызовите loadModel().");
    }
    return model;
}

module.exports = {
    loadModel,
    getModel
};