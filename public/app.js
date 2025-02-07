document.addEventListener("DOMContentLoaded", function () {
    // Группировка функций
    fetchBooks().then(() => {
        initPagination(); // Вызови пагинацию после загрузки книг
    });
    initDropdown();
    initFilterToggle();
    initAddItem();
});

function sortBooks(literature) {
    return literature.sort((a, b) => a.book_id - b.book_id);
}

// Асинхронная функция загрузки книг
async function fetchBooks() {
    try {
        const response = await fetch('http://localhost:3000/api/books');
        if (!response.ok) throw new Error('Ошибка при загрузке данных');

        let literature = await response.json();
        literature = sortBooks(literature);

        const bookList = document.querySelector('.book-list');
        bookList.innerHTML = ''; // Очистка списка перед вставкой новых данных

        literature.forEach(book => {
            const bookItem = createBookElement(book);
            bookList.appendChild(bookItem);
        });

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
                <label for="edit-udk">УДК</label>
                <input type="text" name="udk" placeholder="Введите УДК" value="${book.udc_id}" required>
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
        udc_id: formData.get("udk"),
        quantity: formData.get("quantity")
    };


    console.log("Отправляемые данные:", updatedBook);


    try {
        const response = await fetch(`http://localhost:3000/api/books/${bookId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updatedBook)
        });

        if (!response.ok) {
            const udcInput = bookItem.querySelector('[name="udk"]');
            udcInput.setCustomValidity("УДК не найдено");
            udcInput.reportValidity();
        
            // Добавляем обработчик, чтобы ошибка сбрасывалась при изменении поля
            udcInput.addEventListener("input", function () {
                udcInput.setCustomValidity("");
            });
            throw new Error('Ошибка при обновлении книги')
        };

        console.log("Книга обновлена");
        await fetchBooks(); // Перезагрузка списка книг

    } catch (error) {
        console.error('Ошибка при обновлении книги:', error);
    }
}

//Удалить
const deleteButtons = document.querySelectorAll('.delete-button');
const modal = document.getElementById('deleteModal');
const cancelDeleteButton = document.getElementById('cancelDelete');
const confirmDeleteButton = document.getElementById('confirmDelete');
let itemToDelete = null; // Переменная для хранения книги, которую нужно удалить

// Открытие модального окна при нажатии на кнопку "Удалить"
deleteButtons.forEach(button => {
    button.addEventListener('click', function () {
        itemToDelete = this.closest('.item'); // Находим ближайший элемент книги
        modal.style.display = 'flex'; // Показываем модальное окно
    });
});

// Закрытие модального окна при нажатии на кнопку "Отмена"
cancelDeleteButton.addEventListener('click', function () {
    modal.style.display = 'none'; // Закрываем модальное окно
    itemToDelete = null; // Сбрасываем переменную
});

// Удаление книги при подтверждении
confirmDeleteButton.addEventListener('click', function () {
    if (itemToDelete) {
        itemToDelete.remove(); // Удаляем элемент книги
        modal.style.display = 'none'; // Закрываем модальное окно
        itemToDelete = null; // Сбрасываем переменную
    }
});

// Закрытие модального окна, если кликнули вне его
window.addEventListener('click', function (event) {
    if (event.target === modal) {
        modal.style.display = 'none'; // Закрываем модальное окно, если кликнули вне
        itemToDelete = null; // Сбрасываем переменную
    }
});

function initDropdown() {
    const dropdownToggle = document.querySelector('.dropdown-toggle');
    const dropdownMenu = document.querySelector('.dropdown-menu');

    if (dropdownToggle && dropdownMenu) {
        dropdownToggle.addEventListener('click', function (event) {
            event.preventDefault();
            dropdownMenu.style.display = dropdownMenu.style.display === 'block' ? 'none' : 'block';
        });

        document.addEventListener('click', function (event) {
            if (!dropdownToggle.contains(event.target) && !dropdownMenu.contains(event.target)) {
                dropdownMenu.style.display = 'none';
            }
        });
    }
}

function initFilterToggle() {
    const filterTitleMain = document.querySelector(".filter-title-main");
    const itemFilter = document.querySelector(".item-filter");
    const hideButton = document.querySelector(".hide-button");
    const hideTitle = document.querySelector(".filter-header");

    if (filterTitleMain) {
        filterTitleMain.addEventListener("click", function () {
            const isHidden = itemFilter.style.display === "none" || itemFilter.style.display === "";
            itemFilter.style.display = isHidden ? "flex" : "none";
            const isHiddenTitle = hideTitle.style.display === "flex" || hideTitle.style.display === "";
            hideTitle.style.display = isHiddenTitle ? "none" : "flex";
        });
    }

    if (hideButton) {
        hideButton.addEventListener("click", function () {
            itemFilter.style.display = "none";
            hideTitle.style.display = "flex";
        });
    }
}

function initPagination() {
    const Items = document.querySelectorAll(".item");
    const ItemsPerPage = 10;
    let currentPage = 1;

    const prevPageBtn = document.querySelector(".prev-page");
    const nextPageBtn = document.querySelector(".next-page");
    const pageSelect = document.querySelector(".page-select");
    const pageInfo = document.querySelector(".page-info");

    function displayItems() {
        Items.forEach(item => (item.style.display = "none"));

        const startIndex = (currentPage - 1) * ItemsPerPage;
        const endIndex = startIndex + ItemsPerPage;
        for (let i = startIndex; i < endIndex && i < Items.length; i++) {
            Items[i].style.display = "flex";
        }

        updatePagination();
    }

    function updatePagination() {
        const totalPages = Math.ceil(Items.length / ItemsPerPage);
        pageInfo.textContent = `Страница ${currentPage} из ${totalPages}`;
        prevPageBtn.disabled = currentPage === 1;
        nextPageBtn.disabled = currentPage === totalPages;

        pageSelect.innerHTML = "";
        for (let i = 1; i <= totalPages; i++) {
            const option = document.createElement("option");
            option.value = i;
            option.textContent = `Страница ${i}`;
            option.selected = i === currentPage;
            pageSelect.appendChild(option);
        }
    }

    if (prevPageBtn) {
        prevPageBtn.addEventListener("click", () => {
            if (currentPage > 1) {
                currentPage--;
                displayItems();
            }
        });
    }

    if (nextPageBtn) {
        nextPageBtn.addEventListener("click", () => {
            const totalPages = Math.ceil(Items.length / ItemsPerPage);
            if (currentPage < totalPages) {
                currentPage++;
                displayItems();
            }
        });
    }

    if (pageSelect) {
        pageSelect.addEventListener("change", (e) => {
            currentPage = parseInt(e.target.value);
            displayItems();
        });
    }

    displayItems();
}
