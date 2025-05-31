require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;
const cookieParser = require('cookie-parser');
const { loadModel } = require('./modelLoader');

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Подключение роутеров
const authRoutes = require('./routes/auth');
const emailRoutes = require('./routes/email');
const groupRoutes = require('./routes/group');

const idNumberRoutes = require('./routes/book/id_number');
const booksRoutes = require('./routes/book/books');
const udcId = require('./routes/book/udc_id');
const udcRoutes = require('./routes/book/udcs');
const udcSearchRoutes = require('./routes/book/udcSearch');
const updateBookRoutes = require('./routes/book/update_book');
const addBookRoutes = require('./routes/book/add_book');
const deleteBookRoutes = require('./routes/book/delete_book');
const userBooksRoutes = require('./routes/book/user_books');
const userArchiveRoutes = require('./routes/book/user_archive');
const userRecommendations = require('./routes/book/user_recommendations')

const usersRoutes = require('./routes/user/users');
const deleteUserRoutes = require('./routes/user/delete_user');
const updateUserRoutes = require('./routes/user/update_user');

const issuancesRoutes = require('./routes/issuance/issuances');
const addIssuanceRoutes = require('./routes/issuance/add_issuance');
const deleteIssuanceRoutes = require('./routes/issuance/delete_issuance');
const closeIssuanceRoutes = require('./routes/issuance/close_issuance');

const notificationRoutes = require('./routes/notification/notifications');

const profileRoutes = require('./routes/user/edit_profile');

app.use('/api/auth', authRoutes);
app.use('/api', emailRoutes);
app.use('/api', groupRoutes);

app.use('/api', idNumberRoutes)
app.use('/api/book', booksRoutes);
app.use('/api/book', udcId);
app.use('/api/book/udcs', udcRoutes);
app.use('/api/book/udcs', udcSearchRoutes);
app.use('/api/book', updateBookRoutes);
app.use('/api/book', addBookRoutes);
app.use('/api/book', deleteBookRoutes);
app.use('/api/book', userBooksRoutes);
app.use('/api/book', userArchiveRoutes);
app.use('/api/book', userRecommendations);

app.use('/api/user', usersRoutes);
app.use('/api/user', deleteUserRoutes);
app.use('/api/user', updateUserRoutes);

app.use('/api/issuance', issuancesRoutes);
app.use('/api/issuance', addIssuanceRoutes);
app.use('/api/issuance', deleteIssuanceRoutes);
app.use('/api/issuance', closeIssuanceRoutes);

app.use('/api/notification', notificationRoutes);

app.use('/api/user', profileRoutes);

// Подключение новых API-роутов
const assignLiteratureRoutes = require('./routes/recommendations/assign_literature');
app.use('/api/recommendations', assignLiteratureRoutes);

const assignedLiteratureRoutes = require('./routes/recommendations/assign_literature');  // Путь к файлу assigned_literature.js
app.use('/api', assignedLiteratureRoutes);  // Это гарантирует, что маршрут будет доступен по /api/compare-texts

// Маршруты для пользовательского интерфейса
app.use('/user', express.static(path.join(__dirname, 'public', 'user')));

// Маршруты для административного интерфейса
app.use('/admin', express.static(path.join(__dirname, 'public', 'admin')));

// Запуск сервера
loadModel().then(() => {
  app.listen(PORT, () => {
      console.log(`Сервер запущен на http://localhost:${PORT}`);
  });
}).catch((err) => {
  console.error("Ошибка при загрузке модели:", err);
});