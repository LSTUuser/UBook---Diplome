import { initPagination } from '../pagination.js';
document.addEventListener("DOMContentLoaded", function () {
    // Группировка функций
    fetchIssuances().then(() => {
        initPagination(); // Вызови пагинацию после загрузки книг
    });
    initSearch();
    initFilter();
    populateSelects();
    initAddItem();
    initAddBookButton();
    initCloseAddBookModal();
    initDropdown();
});

async function fetchIssuances(query = "", filters = {}) {
    try {
        const response = await fetch('http://localhost:3000/api/issuance/issuances');
        if (!response.ok) throw new Error('Ошибка при загрузке данных');

        let issuances = await response.json();

        // Фильтрация по поисковому запросу (название книги)
        if (query) {
            issuances = issuances.filter(issuance =>
                issuance.book_name.toLowerCase().includes(query.toLowerCase()) ||
                issuance.author_full_name.toLowerCase().includes(query.toLowerCase())
            );
        }

        // Фильтрация по параметрам фильтра
        if (filters.user_name) {
            issuances = issuances.filter(issuance =>
                issuance.user_full_name.toLowerCase().includes(filters.user_name.toLowerCase())
            );
        }
        if (filters.id_number) {
            issuances = issuances.filter(issuance =>
                issuance.student_id_number.toLowerCase().includes(filters.id_number.toLowerCase())
            );
        }
        if (filters.group) {
            issuances = issuances.filter(issuance =>
                issuance.group_name.toLowerCase().includes(filters.group.toLowerCase())
            );
        }
        if (filters.year) {
            issuances = issuances.filter(issuance =>
                issuance.year_of_studying.toString().includes(filters.year)
            );
        }
        // Фильтрация по диапазону дат (дата выдачи)
        if (filters.start_date) {
            const startDate = new Date(filters.start_date);
            issuances = issuances.filter(issuance =>
                new Date(issuance.issuance_date) >= startDate
            );
        }

        if (filters.end_date) {
            const endDate = new Date(filters.end_date);
            issuances = issuances.filter(issuance =>
                new Date(issuance.issuance_date) <= endDate
            );
        }


        const issuanceList = document.querySelector('.issuance-list');
        issuanceList.innerHTML = ''; // Очистка списка перед вставкой новых данных

        issuances.forEach((issuance, index) => {
            const issuanceItem = createIssuanceElement(issuance, index);
            issuanceList.appendChild(issuanceItem);
        });

        initPagination();

    } catch (error) {
        console.error('Ошибка загрузки книг:', error);
    }
}

function formatDate(dateString) {
    if (!dateString) {
        return "Выдано";
    }

    const date = new Date(dateString);

    // Проверка на недопустимую дату
    if (isNaN(date)) {
        return "Выдано";
    }

    return date.toLocaleDateString("ru-RU");
}


function createIssuanceElement(issuance, index) {
    const issuanceItem = document.createElement('div');
    issuanceItem.classList.add('issuance', 'item');
    issuanceItem.dataset.id = issuance.issuance_id; // Сохраняем ID книги

    // Определяем текст кнопки в зависимости от возврата
    const returnText = issuance.return_period ? 'Сдано' : 'Сдать';
    const returnDisabled = issuance.return_period ? 'disabled' : '';


    issuanceItem.innerHTML =
        `
    <div class="issuance-cover item-cover">
                    <div class="issuance-number">${index + 1}</div>
                    <p class="issuance-user">${issuance.user_full_name}</p>
                    <p class="issuance-date">${formatDate(issuance.issuance_date)}</p>
                    <p class="return-date">${formatDate(issuance.return_date)}</p>
                    <p class="return-period">${formatDate(issuance.return_period)}</p>
                    <div class="issuance-buttons">
                        <button class="edit-button"${returnDisabled}>${returnText}</button>
                        <button class="delete-button">Удалить</button>
                        <button class="toggle-details">Больше информации</button>
                    </div>
    </div>
                <div class="issuance-details item-details">
                    <hr class="line">
                    <div class="book-name">
                        Книга: ${issuance.book_name}
                    </div>
                    <div class="issuance-description">
                        <div class="book-author">Автор: ${issuance.author_full_name}</div>
                        <div class="year_of_publishing">Год издания: ${issuance.year_of_publishing}</div>
                        <div class="udc">УДК: ${issuance.udc_id}</div>
                        <div class="category">Категория: ${issuance.udc_name}</div>
                    </div>
                </div>
    `;

    // Обработчик кнопки "Больше информации"
    issuanceItem.querySelector('.toggle-details').addEventListener('click', function () {
        const details = issuanceItem.querySelector(".item-details");
        details.style.display = details.style.display === "block" ? "none" : "block";
        this.textContent = details.style.display === "block" ? "Скрыть информацию" : "Больше информации";
    });

    // Обработчик кнопки "Редактировать"
    issuanceItem.querySelector('.edit-button').addEventListener('click', async function () {
        if (issuance.returned_date) return;
        await initUpdateItem(issuanceItem);
    });

    // Обработчик кнопки "Удалить"
    issuanceItem.querySelector('.delete-button').addEventListener('click', async function () {
        await initDeleteItem(issuanceItem);
    });

    return issuanceItem;
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

function initCloseAddBookModal() {
    const closeModalButton = document.getElementById('closeModalButton');
    if (closeModalButton) {
        closeModalButton.addEventListener('click', function () {
            const addModal = document.querySelector('.modal'); // Модальное окно добавления книги
            const addBookForm = document.querySelector('.add-modal-content form'); // Форма добавления книги

            // Сбросить значения в select2 для пользователя и книги
            const userSelect = $('#userSelect'); // Инициализация select2 для пользователя
            const bookSelect = $('#bookSelect'); // Инициализация select2 для книги
            userSelect.val(null).trigger('change'); // Очищаем select2 для пользователя
            bookSelect.val(null).trigger('change'); // Очищаем select2 для книги
            addBookForm.reset(); // Сбросить данные в полях формы
            addModal.style.display = 'none'; // Закрытие модального окна
        });
    }
}

async function populateSelects() {
    try {
        const users = await fetch('http://localhost:3000/api/user/users').then(res => res.json());
        const userSelect = document.getElementById('userSelect');
        users.forEach(user => {
            const option = document.createElement('option');
            option.value = user.user_full_name;
            option.textContent = user.user_full_name;
            userSelect.appendChild(option);
        });

        const books = await fetch('http://localhost:3000/api/book/books').then(res => res.json());
        const bookSelect = document.getElementById('bookSelect');
        const availableBooks = books.filter(book => book.available === true);

        availableBooks.forEach(book => {
            const option = document.createElement('option');
            option.value = book.book_name;
            option.textContent = book.book_name;
            bookSelect.appendChild(option);
        });

        // Подключаем Select2 к полям
        $('#userSelect').select2({
            placeholder: "Выберите пользователя",
            allowClear: true,
            language: {
                noResults: function() {
                    return "Не найдено пользователей по запросу";
                }
            }
        });

        $('#bookSelect').select2({
            placeholder: "Выберите книгу",
            allowClear: true,
            language: {
                noResults: function() {
                    return "Не найдено книг по запросу";
                }
            }
        });

    } catch (error) {
        console.error('Ошибка при загрузке данных для выпадающих списков:', error);
    }
}

async function initAddItem() {
    const addIssuanceForm = document.querySelector('.add-issuance-form');

    const users = await fetch('http://localhost:3000/api/user/users').then(res => res.json());
    const books = await fetch('http://localhost:3000/api/book/books').then(res => res.json());

    const $userSelect = $('#userSelect'); // jQuery
    const $bookSelect = $('#bookSelect');

    $userSelect.on('change', function () {
        document.getElementById('userSelect').setCustomValidity('');
    });

    $bookSelect.on('change', function () {
        document.getElementById('bookSelect').setCustomValidity('');
    });

    addIssuanceForm.addEventListener('submit', async function (event) {
        event.preventDefault();

        const formData = new FormData(addIssuanceForm);
        const fullName = formData.get('name');
        const bookTitle = formData.get('book');

        const user = users.find(u => u.user_full_name === fullName);
        const book = books.find(b => b.book_name === bookTitle);

        // Сброс ошибок перед проверками
        const userSelect = document.getElementById('userSelect');
        const bookSelect = document.getElementById('bookSelect');
        userSelect.setCustomValidity('');
        bookSelect.setCustomValidity('');

        // Проверка на наличие пользователя и книги
        if (!user) {
            userSelect.setCustomValidity("Выберите пользователя");
        }

        if (!book) {
            bookSelect.setCustomValidity("Выберите книгу");
        }

        // Если есть ошибки, не продолжаем выполнение
        if (!user || !book) {
            userSelect.reportValidity();
            bookSelect.reportValidity();
            return;
        }

        const issuanceData = {
            book_id: book.book_id,
            email: user.email,
            issuance_date: formData.get('start-date'),
            return_date: formData.get('end-date')
        };

        console.log("Отправляемые данные на сервер:", issuanceData);

        const response = await fetch('http://localhost:3000/api/issuance/issuances', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(issuanceData)
        });

        if (response.ok) {
            const newIssuance = await response.json();
            const issuanceList = document.querySelector('.issuance-list');
            const issuanceItem = createIssuanceElement(newIssuance);
            issuanceList.prepend(issuanceItem); // Добавляем в начало списка

            addIssuanceForm.reset(); // Сбрасываем обычные поля формы
            $userSelect.val('').trigger('change');
            $bookSelect.val('').trigger('change');
            await fetchIssuances();
            initPagination();
        } else {
            alert('Ошибка при добавлении книги');
        }
    });

    addIssuanceForm.addEventListener('reset', function (event) {
        // Сброс значений select2 для пользователя и книги с помощью методов select2
        $userSelect.val(null).trigger('change'); // Сбросить select2 для пользователя
        $bookSelect.val(null).trigger('change'); // Сбросить select2 для книги

        // Дополнительно сбрасываем обычные поля формы
        addIssuanceForm.reset();

    });
}

async function initUpdateItem(issuanceItem) {
    const issuanceId = issuanceItem.dataset.id;
    const issuanceModal = document.getElementById("issuanceModal");
    const cancelIssuanceButton = document.getElementById("cancelIssuance");
    const confirmIssuanceButton = document.getElementById("confirmIssuance");

    // Функция для закрытия модального окна
    function closeModal() {
        issuanceModal.style.display = "none";
        cancelIssuanceButton.removeEventListener("click", closeModal);
        confirmIssuanceButton.removeEventListener("click", confirmClose);
    }
    // Функция для подтверждения удаления
    async function confirmClose() {
        try {
            const today = new Date();
            const isoDate = today.toISOString().split('T')[0];
            const response = await fetch(`http://localhost:3000/api/issuance/issuances/${issuanceId}/return`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    return_period: isoDate
                })
            });

            if (!response.ok) {
                throw new Error("Ошибка при удалении выдачи");
            }

            console.log(`Выдача с id ${issuanceId} закрыта`);
            const returnPeriodEl = issuanceItem.querySelector('.return-period');
            returnPeriodEl.textContent = formatDate(isoDate); // форматированная дата

            const editBtn = issuanceItem.querySelector('.edit-button');
            editBtn.textContent = "Сдано";
            editBtn.disabled = true;
            editBtn.classList.add('disabled');
            closeModal();
        } catch (error) {
            console.error("Ошибка при закрытии выдачи:", error);
            alert("Не удалось закрыть выдачу. Проверьте консоль для подробностей.");
            closeModal();
        }
    }

    // Удаление старых обработчиков перед добавлением новых
    cancelIssuanceButton.removeEventListener("click", closeModal);
    confirmIssuanceButton.removeEventListener("click", confirmClose);

    // Добавляем новые обработчики
    cancelIssuanceButton.addEventListener("click", closeModal);
    confirmIssuanceButton.addEventListener("click", confirmClose);

    // Показать модальное окно
    issuanceModal.style.display = "flex";
}

async function initDeleteItem(issuanceItem) {
    const issuanceId = issuanceItem.dataset.id;
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
            const response = await fetch(`http://localhost:3000/api/issuance/issuances/${issuanceId}`, {
                method: 'DELETE'
            });
            const text = await response.text();
            console.log("Ответ сервера:", response.status, text);

            if (!response.ok) {
                throw new Error("Ошибка при удалении выдачи");
            }

            console.log(`Выдача с id ${issuanceId} удалена`);
            issuanceItem.remove(); // Удаление элемента из списка
            await fetchIssuances();
            initPagination();
            closeModal();
        } catch (error) {
            console.error("Ошибка при удалении пользователя:", error);
            alert("Не удалось удалить пользователя. Проверьте консоль для подробностей.");
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
            console.log('Крестик показан')
        } else {
            clearSearch.style.display = 'none'; // Скрываем крестик
        }
    });

    // Обработчик клика на крестик
    clearSearch.addEventListener('click', function () {
        searchInput.value = ''; // Очищаем поле
        clearSearch.style.display = 'none'; // Скрываем крестик
        fetchIssuances(); // Перезагружаем книги (без поискового запроса)
    });

    // Обработчик клика на кнопку "Поиск"
    searchButton.addEventListener('click', function () {
        const searchText = searchInput.value.toLowerCase().trim();

        // Передаем поисковый запрос и пустой объект фильтров
        fetchIssuances(searchText, {});
    });
}

function initFilter() {
    const filterForm = document.querySelector('.filter-form');

    if (filterForm) {
        filterForm.addEventListener('submit', function (event) {
            event.preventDefault(); // Предотвращаем отправку формы

            // Собираем данные из формы
            const filterData = {
                user_name: filterForm.querySelector('#name').value.trim(),
                id_number: filterForm.querySelector('#student_id_number').value.trim(),
                group: filterForm.querySelector('#group').value.trim(),
                year: filterForm.querySelector('#year').value.trim(),
                start_date: filterForm.querySelector('#start-date').value.trim(),
                end_date: filterForm.querySelector('#end-date').value.trim(),
            };

            // Получаем текущий поисковый запрос
            const searchInput = document.querySelector('.search-input');
            const searchText = searchInput.value.trim();

            // Передаем поисковый запрос и данные фильтра в fetchBooks
            fetchIssuances(searchText, filterData);
        });

        // Обработчик кнопки "Сбросить"
        filterForm.addEventListener('reset', function () {
            // Получаем текущий поисковый запрос
            const searchInput = document.querySelector('.search-input');
            const searchText = searchInput.value.trim();

            // Передаем поисковый запрос и пустой объект фильтров
            fetchIssuances(searchText, {});
        });
    }
}

const downloadButton = document.getElementById('downloadDebtorsBtn');
if (downloadButton) {
    downloadButton.addEventListener('click', downloadDebtorsList);
}


async function downloadDebtorsList() {
    try {
        const response = await fetch('http://localhost:3000/api/issuance/issuances');
        const issuances = await response.json();

        const today = new Date();

        const debtors = issuances.filter(issuance => {
            // Проверяем, если дата возврата прошла, а return_period еще не заполнен
            const returnDate = new Date(issuance.return_date);
            const returnPeriod = issuance.return_period ? new Date(issuance.return_period) : null;

            return returnDate < today && !returnPeriod; // Книга просрочена и не сдана
        });

        if (debtors.length === 0) {
            alert("Нет должников на текущую дату.");
            return;
        }

        let csvContent = 'ФИО пользователя;Email;Название книги;Автор;Дата выдачи;Дата возврата\n';

        debtors.forEach(debtor => {
            const row = [
                debtor.user_full_name,
                debtor.email,
                debtor.book_name,
                debtor.author_full_name,
                new Date(debtor.issuance_date).toLocaleDateString(),
                new Date(debtor.return_date).toLocaleDateString(),
            ];
            csvContent += row.join(';') + '\n';
        });

        // 🔥 Вставляем BOM перед CSV — это решает проблему кодировки
        const csvWithBom = '\uFEFF' + csvContent;
        const blob = new Blob([csvWithBom], { type: 'text/csv;charset=utf-8;' });

        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'debtors.csv';
        a.click();
        URL.revokeObjectURL(url);

    } catch (error) {
        console.error('Ошибка при создании CSV:', error);
    }
}
