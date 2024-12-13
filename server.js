const express = require('express');
const app = express();
const path = require('path');

app.use(express.static(path.join(__dirname, 'public')));

// Маршруты для пользовательского интерфейса
app.use('/user', express.static(path.join(__dirname, 'public', 'user')));

// Маршруты для административного интерфейса
app.use('/admin', express.static(path.join(__dirname, 'public', 'admin')));

app.post('/login', (req, res) => {
  res.send('Обработка логина');
});
  

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Сервер запущен на http://localhost:${PORT}`);
});
