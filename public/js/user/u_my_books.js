import { initPagination } from '../pagination.js';
document.addEventListener("DOMContentLoaded", function () {
    // Группировка функций
    fetchBooks().then(() => {
        initPagination(); // Вызови пагинацию после загрузки книг
        //initSearch();
    });
    //initFilter();
    initDropdown();
});

async function fetchBooks(query = "", filters = {}) {
    try {
        const response = await fetch('http://localhost:3000/api/book/user_books');
        if (!response.ok) throw new Error('Ошибка при загрузке данных');

        let literature = await response.json();


        // // Фильтрация по поисковому запросу (название книги)
        // if (query) {
        //     literature = literature.filter(book =>
        //         book.book_name.toLowerCase().includes(query.toLowerCase())
        //     );
        // }

        // // Фильтрация по параметрам фильтра
        // if (filters.author) {
        //     literature = literature.filter(book =>
        //         book.author_full_name.toLowerCase().includes(filters.author.toLowerCase())
        //     );
        // }
        // if (filters.category) {
        //     literature = literature.filter(book =>
        //         book.udc_name.toLowerCase().includes(filters.category.toLowerCase())
        //     );
        // }
        // if (filters.year) {
        //     literature = literature.filter(book =>
        //         book.year_of_publishing.toString().includes(filters.year)
        //     );
        // }
        // if (filters.udk) {
        //     literature = literature.filter(book =>
        //         book.udc_id.toLowerCase().includes(filters.udk.toLowerCase())
        //     );
        // }

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

function createBookElement(book) {
    const bookItem = document.createElement('div');
    bookItem.classList.add('book', 'item');
    bookItem.dataset.id = book.book_id; // Сохраняем ID книги

    bookItem.innerHTML = `
            <h3 class="book-name">Совершенный код</h3>
                <h5 class="book-date">
                    Дата выдачи: 23.11.2024<br>
                    Дата возврата: 07.12.2024
                </h5>
            <button class="toggle-details">Больше информации</button>
            <div class="book-details item-details">
                <hr class="line">
                <div class="book-description">
                    <div>Автор: Стив Макконелл</div>
                    <div>Год издания: 1993</div>
                    <div>УДК: 004.45</div>
                    <div>Категория: Качество систем и программ</div>
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