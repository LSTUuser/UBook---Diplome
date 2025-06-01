import { initPagination } from '../pagination.js';
document.addEventListener("DOMContentLoaded", function () {
    // Группировка функций
    fetchBooks().then(() => {
        initPagination(); // Вызови пагинацию после загрузки книг
        initSearch();
    });
    initFilter();
    initDropdown();
    initAddItem();
    initFormReset();
    initAddBookButton();
    initCloseAddBookModal();
});

function sortBooks(literature) {
    return literature.sort((a, b) => b.book_id - a.book_id);
}

// Асинхронная функция загрузки книг
async function fetchBooks(query = "", filters = {}) {
    try {
        const response = await fetch('http://localhost:3000/api/book/books');
        if (!response.ok) throw new Error('Ошибка при загрузке данных');

        let literature = await response.json();
        literature = sortBooks(literature);

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

        if (literature.length === 0) {
            bookList.innerHTML = '<p>Книги не найдены</p>';
            return;
        }

        bookList.innerHTML = ''; // Очистка списка перед вставкой новых данных

        literature.forEach(book => {
            const bookItem = createBookElement(book);
            bookList.appendChild(bookItem);
        });

        initPagination();

    } catch (error) {
        console.error('Ошибка загрузки книг:', error);
    }
}

// Функция создания элемента книги
function createBookElement(book) {
    const bookItem = document.createElement('div');
    bookItem.classList.add('book', 'item');
    bookItem.dataset.id = book.book_id; // Сохраняем ID книги

    bookItem.innerHTML = `
    <div class="book-cover item-cover">
        <h3 class="book-name">${book.book_name}</h3>
        <div class="book-buttons">
            <h4 class="quantity">Количество: ${book.quantity}</h4>
            <button class="edit-button">Редактировать</button>
            <button class="delete-button">Удалить</button>
            <button class="toggle-details">Больше информации</button>
        </div>
    </div>
    <div class="edit-book-form edit-item-form">
        <h3 class="filter-title">Редактирование книги</h3>
        <form class="filter-form">
            <div class="input-group">
                <label for="edit-name">Название</label>
                <input type="text" name="name" placeholder="Введите название книги" value="${book.book_name}" required>
            </div>
            <div class="input-group">
                <label for="edit-author">Автор</label>
                <input type="text" name="author" placeholder="Введите имя автора" value="${book.author_full_name}" required>
            </div>
            <div class="input-group">
                <label for="edit-year">Год издания</label>
                <input type="number" name="year" min="1" placeholder="Введите год" value="${book.year_of_publishing}" required>
            </div>
            <div class="input-group">
                <label for="edit-quantity">Количество:</label>
                <input type="number" name="quantity" min="0" placeholder="Введите количество" value="${book.quantity}" required>
            </div>
            <div class="filter-buttons">
                <button type="button" class="filter-button hide-button hide-edit-button">Отмена</button>
                <button type="submit" class="filter-button apply-button">Сохранить</button>
                <button type="reset" class="filter-button reset-button">Сбросить</button>
            </div>
        </form>
    </div>
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

    // Обработчик кнопки "Редактировать"
    bookItem.querySelector('.edit-button').addEventListener('click', function () {
        const details = bookItem.querySelector(".item-details");
        bookItem.querySelector('.edit-book-form').style.display = "block";
        bookItem.querySelector('.item-cover').style.display = "none";
        details.style.display = "none";
    });

    // Обработчик кнопки "Отмена" в форме редактирования
    bookItem.querySelector('.hide-edit-button').addEventListener('click', function () {
        const form = bookItem.querySelector('.edit-item-form form');
        form.reset(); // Сбросить данные в полях формы
        bookItem.querySelector('.edit-book-form').style.display = "none";
        bookItem.querySelector('.item-cover').style.display = "flex";
        bookItem.querySelector('.toggle-details').textContent = "Больше инфомрации";
    });

    // Обработчик формы редактирования книги
    bookItem.querySelector('.edit-item-form form').addEventListener('submit', async function (event) {
        event.preventDefault();

        // Проверка на пустые строки
        const inputs = bookItem.querySelectorAll('.edit-item-form input[type="text"], .edit-item-form input[type="number"]');
        let isFormValid = true;

        inputs.forEach(input => {
            if (!input.value.trim()) {
                input.setCustomValidity("Это поле не может быть пустым.");
                input.reportValidity();
                isFormValid = false;
            } else {
                input.setCustomValidity("");
            }
        });

        if (!isFormValid) {
            return; // Останавливаем отправку формы, если есть пустые поля
        }

        await updateBook(bookItem);
    });

    // Обработчик кнопки "Сбросить" в форме редактирования
    bookItem.querySelector('.edit-item-form form').addEventListener('reset', function () {
        const inputs = bookItem.querySelectorAll('.edit-item-form input[type="text"], .edit-item-form input[type="number"]');
        inputs.forEach(input => {
            input.setCustomValidity(""); // Сбрасываем кастомное сообщение об ошибке
            input.reportValidity(); // Обновляем состояние валидации
        });
    });

    // Обработчик кнопки "Удалить"
    bookItem.querySelector('.delete-button').addEventListener('click', async function () {
        await initDeleteItem(bookItem);
    });

    return bookItem;
}

// Функция редактирования книги
async function updateBook(bookItem) {
    const bookId = bookItem.dataset.id;
    const formData = new FormData(bookItem.querySelector('.edit-item-form form'));

    const updatedBook = {
        book_name: formData.get("name"),
        author_full_name: formData.get("author"),
        year_of_publishing: formData.get("year"),
        quantity: formData.get("quantity")
    };


    console.log("Отправляемые данные:", updatedBook);


    try {
        const response = await fetch(`http://localhost:3000/api/book/books/${bookId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updatedBook)
        });

        console.log("Книга обновлена");
        await fetchBooks(); // Перезагрузка списка книг

    } catch (error) {
        console.error('Ошибка при обновлении книги:', error);
    }
}

function initAddBookButton() {
    const addBookButton = document.getElementById('openModalButton'); // Кнопка "Добавить книгу"
    if (addBookButton) {
        addBookButton.addEventListener('click', function () {
            const addModal = document.querySelector('.modal'); // Модальное окно добавления книги
            addModal.style.display = 'flex'; // Открытие модального окна
        });
    }
}

function initFormReset() {
    const addBookForm = document.querySelector('.add-book-form');
    
    if (addBookForm) {
        addBookForm.addEventListener('reset', function() {
            // Специальный сброс для Select2 (поле УДК)
            $('#udkSelect').val(null).trigger('change');
            
            // Дополнительно: сброс других кастомных полей если есть
            // $('.other-select2-field').val(null).trigger('change');
        });
    }
}

function initCloseAddBookModal() {
    const closeModalButton = document.getElementById('closeModalButton');
    if (closeModalButton) {
        closeModalButton.addEventListener('click', function () {
            const addModal = document.querySelector('.modal'); // Модальное окно добавления книги
            const addBookForm = document.querySelector('.add-modal-content form'); // Форма добавления книги

            addBookForm.reset(); // Сбросить данные в полях формы
            $('#udkSelect').val(null).trigger('change');
            addModal.style.display = 'none'; // Закрытие модального окна
        });
    }
}

function initAddItem() {
    // Инициализация Select2 для УДК
    initUdcSearch();

    const addBookForm = document.querySelector('.add-book-form');
    
    addBookForm.addEventListener('submit', async function(event) {
        event.preventDefault();

        const submitBtn = addBookForm.querySelector('button[type="submit"]');
        const resetBtn = addBookForm.querySelector('button[type="reset"]');
        const hideBtn = addBookForm.querySelector('button[type="button"]');
        
        const formData = new FormData(addBookForm);
        const udkValue = $('#udkSelect').val();
        
        const bookData = {
            book_name: formData.get('name'),
            author_full_name: formData.get('author'),
            year_of_publishing: formData.get('year'),
            udc_id: udkValue,
            quantity: formData.get('quantity')
        };

        try {
            submitBtn.disabled = true;
            if (resetBtn) resetBtn.disabled = true;
            if (hideBtn) hideBtn.disabled = true;
            submitBtn.textContent = 'Добавление...';

            const response = await fetch('http://localhost:3000/api/book/books', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(bookData)
            });

            if (!response.ok) {
                throw new Error(await response.text() || 'Ошибка при добавлении книги');
            }

            const newBook = await response.json();
            
            // 1. Обновляем интерфейс
            const bookList = document.querySelector('.book-list');
            const bookItem = createBookElement(newBook);
            bookList.prepend(bookItem);

            // 2. Закрываем модальное окно
            document.getElementById('addItemModal').style.display = 'none';

            // 3. Показываем уведомление (если есть назначенная дисциплина)
            if (newBook.assigned_subject) {
                showNotification(
                    `Книга добавлена в рекомендации для дисциплины: ${newBook.assigned_subject}`,
                    'success'
                );
            } else {
                showNotification(
                    'Книга успешно добавлена в фонд',
                    'success'
                );
            }

            // 4. Сбрасываем форму и обновляем список
            addBookForm.reset();
            $('#udkSelect').val(null).trigger('change');
            await fetchBooks();
            initPagination();

        } catch (error) {
            console.error('Ошибка:', error);
            showNotification(
                error.message || 'Ошибка при добавлении книги',
                'error'
            );
        } finally {
            // Разблокируем кнопки
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.textContent = 'Добавить';
            }
            if (resetBtn) resetBtn.disabled = false;
            if (hideBtn) hideBtn.disabled = false;
        }
    });
}

// Универсальная функция показа уведомлений
function showNotification(message, type = 'success') {
    // Удаляем предыдущие уведомления
    document.querySelectorAll('.custom-notification').forEach(el => el.remove());

    const notification = document.createElement('div');
    notification.className = `custom-notification ${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <span>${message}</span>
        </div>
    `;

    document.body.appendChild(notification);

    // Автоматическое удаление
    setTimeout(() => {
        notification.style.opacity = '0';
        setTimeout(() => {
            notification.remove();
            style.remove();
        }, 300);
    }, 4000);
}

// Инициализация выпадающего списка УДК с подгрузкой при прокрутке
function initUdcSearch() {
    $('#udkSelect').select2({
        placeholder: "Введите УДК",
        allowClear: false,
        minimumInputLength: 1,
        language: {
            inputTooShort: function() {
                return "Введите хотя бы 1 символ";
            },
            noResults: function() {
                return "Ничего не найдено";
            }
        },
        dropdownParent: $('#udkSelect').parent(),
        width: '100%',
        ajax: {
            url: 'http://localhost:3000/api/book/udcs/search',
            dataType: 'json',
            delay: 300,
            data: function(params) {
                return {
                    query: params.term
                };
            },
            processResults: function(data) {
                // Убедитесь, что сервер возвращает массив напрямую
                return {
                    results: data.map(item => ({
                        id: item.udc_id,
                        text: item.udc_id
                    }))
                };
            },
            cache: true
        }
    });
}

// Функция удаления книги 
async function initDeleteItem(bookItem) {
    const bookId = bookItem.dataset.id;
    const deleteModal = document.getElementById("deleteModal");
    const cancelDeleteButton = document.getElementById("cancelDelete");
    const confirmDeleteButton = document.getElementById("confirmDelete");

    // Функция для закрытия модального окна
    function closeModal() {
        deleteModal.style.display = "none";
        cancelDeleteButton.removeEventListener("click", closeModal);
        confirmDeleteButton.removeEventListener("click", confirmDelete);
    }

    // Функция для подтверждения удаления
    async function confirmDelete() {
        try {
            const response = await fetch(`http://localhost:3000/api/book/books/${bookId}`, {
                method: 'DELETE'
            });
            const text = await response.text();
            console.log("Ответ сервера:", response.status, text);

            if (!response.ok) {
                throw new Error("Ошибка при удалении книги");
            }

            console.log(`Книга с ID ${bookId} удалена`);
            bookItem.remove(); // Удаление элемента из списка
            initPagination();
            closeModal();
        } catch (error) {
            console.error("Ошибка при удалении книги:", error);
            alert("Не удалось удалить книгу. Проверьте консоль для подробностей.");
            closeModal();
        }
    }

    // Удаление старых обработчиков перед добавлением новых
    cancelDeleteButton.removeEventListener("click", closeModal);
    confirmDeleteButton.removeEventListener("click", confirmDelete);

    // Добавляем новые обработчики
    cancelDeleteButton.addEventListener("click", closeModal);
    confirmDeleteButton.addEventListener("click", confirmDelete);

    // Показать модальное окно
    deleteModal.style.display = "flex";
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