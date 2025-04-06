require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;
const cookieParser = require('cookie-parser');

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
const updateBookRoutes = require('./routes/book/update_book');
const addBookRoutes = require('./routes/book/add_book');
const deleteBookRoutes = require('./routes/book/delete_book');

app.use('/api/auth', authRoutes);
app.use('/api', emailRoutes);
app.use('/api', groupRoutes);
app.use('/api', idNumberRoutes)
app.use('/api/book', booksRoutes);
app.use('/api/book', udcId);
app.use('/api/book', updateBookRoutes);
app.use('/api/book', addBookRoutes);
app.use('/api/book', deleteBookRoutes);

// Маршруты для пользовательского интерфейса
app.use('/user', express.static(path.join(__dirname, 'public', 'user')));

// Маршруты для административного интерфейса
app.use('/admin', express.static(path.join(__dirname, 'public', 'admin')));

// Запуск сервера
app.listen(PORT, () => {
    console.log(`Сервер запущен на http://localhost:${PORT}`);
});
