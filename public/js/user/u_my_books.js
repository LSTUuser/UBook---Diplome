import { initPagination } from '../pagination.js';
import { checkUnreadNotifications } from '../checkUnredNotif.js';
document.addEventListener("DOMContentLoaded", async function () {
    await checkUnreadNotifications();
    // Группировка функций
    fetchBooks().then(() => {
        initPagination(); // Вызови пагинацию после загрузки книг
        initSearch();
    });
    initFilter();
    initDropdown();
});

async function fetchBooks(query = "", filters = {}) {
    try {
        const response = await fetch('http://localhost:3000/api/book/user_books');
        if (!response.ok) throw new Error('Ошибка при загрузке данных');

        let literature = await response.json();


        // Фильтрация по поисковому запросу (название книги)
        if (query) {
            literature = literature.filter(book =>
                book.book_name.toLowerCase().includes(query.toLowerCase())
            );
        }

        // Фильтрация по параметрам фильтра
        if (filters.author) {
            literature = literature.filter(book =>
                book.author_full_name.toLowerCase().includes(filters.author.toLowerCase())
            );
        }
        if (filters.category) {
            literature = literature.filter(book =>
                book.udc_name.toLowerCase().includes(filters.category.toLowerCase())
            );
        }
        if (filters.year) {
            literature = literature.filter(book =>
                book.year_of_publishing.toString().includes(filters.year)
            );
        }
        if (filters.udk) {
            literature = literature.filter(book =>
                book.udc_id.toLowerCase().includes(filters.udk.toLowerCase())
            );
        }

        const bookList = document.querySelector('.book-list');
        bookList.innerHTML = ''; // Очистка списка перед вставкой новых данных

        // if (literature.length === 0) {
        //     bookList.innerHTML = '<p>У вас нет выданных книг</p>';
        //     return;
        // }

        literature.forEach(book => {
            const bookItem = createBookElement(book);
            bookList.appendChild(bookItem);
        });

        initPagination();

    } catch (error) {
        console.error('Ошибка загрузки книг:', error);
    }
}

function formatDate(dateString) {

    const date = new Date(dateString);

    return date.toLocaleDateString("ru-RU");
}

function createBookElement(book) {
    const bookItem = document.createElement('div');
    bookItem.classList.add('book', 'item');
    bookItem.dataset.id = book.book_id; // Сохраняем ID книги

    bookItem.innerHTML = `
            <h3 class="book-name">${book.book_name}</h3>
                <h5 class="book-date">
                    Дата выдачи: ${formatDate(book.issuance_date)}<br>
                    Дата возврата: ${formatDate(book.return_date)}
                </h5>
            <button class="toggle-details">Больше информации</button>
            <div class="book-details item-details">
                <hr class="line">
                <div class="book-description">
                    <div>Автор: ${book.author_full_name}</div>
                    <div>Год издания: ${book.year_of_publishing}</div>
                    <div>УДК: ${book.udc_id}</div>
                    <div>Категория: ${book.udc_name}</div>
                </div>
            </div>
    `;

    // Обработчик кнопки "Больше информации"
    bookItem.querySelector('.toggle-details').addEventListener('click', function () {
        const details = bookItem.querySelector(".item-details");
        details.style.display = details.style.display === "block" ? "none" : "block";
        this.textContent = details.style.display === "block" ? "Скрыть информацию" : "Больше информации";
    });

    return bookItem;
}

function initSearch() {
    const searchInput = document.querySelector('.search-input');
    const searchButton = document.querySelector('.search-button');
    const clearSearch = document.getElementById('clear-search'); // Крестик

    // Обработчик ввода текста в поле поиска
    searchInput.addEventListener('input', function () {
        if (searchInput.value.trim() !== '') {
            clearSearch.style.display = 'block'; // Показываем крестик
        } else {
            clearSearch.style.display = 'none'; // Скрываем крестик
        }
    });

    // Обработчик клика на крестик
    clearSearch.addEventListener('click', function () {
        searchInput.value = ''; // Очищаем поле
        clearSearch.style.display = 'none'; // Скрываем крестик
        fetchBooks(); // Перезагружаем книги (без поискового запроса)
    });

    // Обработчик клика на кнопку "Поиск"
    searchButton.addEventListener('click', function () {
        const searchText = searchInput.value.toLowerCase().trim();

        // Передаем поисковый запрос и пустой объект фильтров
        fetchBooks(searchText, {});
    });
}

function initFilter() {
    const filterForm = document.querySelector('.filter-form');

    if (filterForm) {
        filterForm.addEventListener('submit', function (event) {
            event.preventDefault(); // Предотвращаем отправку формы

            // Собираем данные из формы
            const filterData = {
                author: filterForm.querySelector('#author').value.trim(),
                category: filterForm.querySelector('#category').value.trim(),
                year: filterForm.querySelector('#year').value.trim(),
                udk: filterForm.querySelector('#udk').value.trim(),
            };

            // Получаем текущий поисковый запрос
            const searchInput = document.querySelector('.search-input');
            const searchText = searchInput.value.trim();

            // Передаем поисковый запрос и данные фильтра в fetchBooks
            fetchBooks(searchText, filterData);
        });

        // Обработчик кнопки "Сбросить"
        filterForm.addEventListener('reset', function () {
            // Получаем текущий поисковый запрос
            const searchInput = document.querySelector('.search-input');
            const searchText = searchInput.value.trim();

            // Передаем поисковый запрос и пустой объект фильтров
            fetchBooks(searchText, {});
        });
    }
}