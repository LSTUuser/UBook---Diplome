document.addEventListener("DOMContentLoaded", function () {
    // Группировка функций
    fetchBooks().then(() => {
        initPagination(); // Вызови пагинацию после загрузки книг
    });
    initDropdown();
    initFilterToggle();
    initAddItem();
    initAddBookButton();
    initCloseAddBookModal();
});

function sortBooks(literature) {
    return literature.sort((a, b) => b.book_id - a.book_id);
}

// Асинхронная функция загрузки книг
async function fetchBooks() {
    try {
        const response = await fetch('http://localhost:3000/api/books');
        if (!response.ok) throw new Error('Ошибка при загрузке данных');

        let literature = await response.json();
        console.log("Данные с сервера:", literature);
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

            addBookForm.reset(); // Сбросить данные в полях формы
            addModal.style.display = 'none'; // Закрытие модального окна
        });
    }
}


async function initAddItem() {
    const addBookForm = document.querySelector('.add-book-form');
    const udcInput = addBookForm.querySelector('[name="udk"]'); // поле ввода УДК

    // Сбрасываем ошибку при изменении значения в поле УДК
    udcInput.addEventListener('input', async function () {
        udcInput.setCustomValidity(''); // Сбрасываем ошибку
        udcInput.reportValidity(); // Обновляем статус ошибки
    });

    addBookForm.addEventListener('submit', async function (event) {
        event.preventDefault();

        const formData = new FormData(addBookForm);
        const bookData = {
            book_name: formData.get('name'),
            author_full_name: formData.get('author'),
            year_of_publishing: formData.get('year'),
            udc_id: formData.get('udk'),
            quantity: formData.get('quantity')
        };

        console.log("Отправляемые данные на сервер:", bookData);

        // Проверка на существование УДК
        try {
            const checkUdcResponse = await fetch(`http://localhost:3000/api/validate-udc/${bookData.udc_id}`);
            const checkUdcData = await checkUdcResponse.json();

            if (checkUdcResponse.ok) {
                // Если УДК существует, отправляем данные
                const response = await fetch('http://localhost:3000/api/books', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(bookData)
                });

                if (response.ok) {
                    const newBook = await response.json();
                    const bookList = document.querySelector('.book-list');
                    const bookItem = createBookElement(newBook);
                    bookList.prepend(bookItem); // Добавляем в начало списка

                    addBookForm.reset();
                    await fetchBooks();
                } else {
                    alert('Ошибка при добавлении книги');
                }
            } else {
                // Если УДК не найдено, показываем ошибку на форме
                udcInput.setCustomValidity('УДК не найдено');
                udcInput.reportValidity();
            }
        } catch (error) {
            console.error('Ошибка при проверке УДК:', error);
        }
    });
}


// Функция удаления книги
async function initDeleteItem(bookItem) {
    const bookId = bookItem.dataset.id;
    const deleteModal = document.getElementById("deleteModal");
    const cancelDeleteButton = document.getElementById("cancelDelete");
    const confirmDeleteButton = document.getElementById("confirmDelete");

    // Показать модальное окно
    deleteModal.style.display = "flex";

    // Обработчик на кнопку "Отмена"
    cancelDeleteButton.addEventListener("click", function () {
        deleteModal.style.display = "none"; // Закрываем модальное окно
    });

    // Обработчик на кнопку "Удалить"
    confirmDeleteButton.addEventListener("click", async function () {
        try {
            const response = await fetch(`http://localhost:3000/api/books/${bookId}`, {
                method: 'DELETE'
            });
            const text = await response.text();
            console.log("Ответ сервера:", response.status, text);

            if (!response.ok) {
                throw new Error("Ошибка при удалении книги");
            }

            console.log(`Книга с ID ${bookId} удалена`);
            bookItem.remove(); // Удаление элемента из списка

            // Закрыть модальное окно после успешного удаления
            deleteModal.style.display = "none";
        } catch (error) {
            console.error("Ошибка при удалении книги:", error);
            alert("Не удалось удалить книгу. Проверьте консоль для подробностей.");
            deleteModal.style.display = "none"; // Закрыть окно в случае ошибки
        }
    });
}


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
