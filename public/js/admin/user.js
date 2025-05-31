import { initPagination } from '../pagination.js';
document.addEventListener("DOMContentLoaded", function () {
    // Группировка функций
    fetchUsers().then(() => {
        initPagination(); // Вызови пагинацию после загрузки книг
    });
    initSearch();
    initFilter();
    initDropdown();
});

// Асинхронная функция загрузки книг
async function fetchUsers(query = "", filters = {}) {
    try {
        const response = await fetch('http://localhost:3000/api/user/users');
        if (!response.ok) throw new Error('Ошибка при загрузке данных');

        let users = await response.json();
        // users = sortUsers(users);

        // Фильтрация по поисковому запросу (название книги)
        if (query) {
            users = users.filter(user =>
                user.user_full_name.toLowerCase().includes(query.toLowerCase())
            );
        }

        // Фильтрация по параметрам фильтра
        if (filters.user_email) {
            users = users.filter(user =>
                user.email.toLowerCase().includes(filters.user_email.toLowerCase())
            );
        }
        if (filters.id_number) {
            users = users.filter(user =>
                user.student_id_number.toLowerCase().includes(filters.id_number.toLowerCase())
            );
        }
        if (filters.group) {
            users = users.filter(user =>
                user.group_name.toLowerCase().includes(filters.group.toLowerCase())
            );
        }
        if (filters.year) {
            users = users.filter(user =>
                user.year_of_studying.toString().includes(filters.year)
            );
        }

        if (users.length === 0) {
            userList.innerHTML = '<p>Пользователи не найдены</p>';
            return;
        }

        const userList = document.querySelector('.user-list');
        userList.innerHTML = ''; // Очистка списка перед вставкой новых данных

        users.forEach(user => {
            const userItem = createUserElement(user);
            userList.appendChild(userItem);
        });

        initPagination();

    } catch (error) {
        console.error('Ошибка загрузки книг:', error);
    }
}

// Функция создания элемента книги
function createUserElement(user) {
    const userItem = document.createElement('div');
    userItem.classList.add('user', 'item');
    userItem.dataset.email = user.email; // Сохраняем ID книги

    userItem.innerHTML =
    `
    <div class="user-cover item-cover" data-student-id="${user.student_id_number}">
                        <h3 class="user-name">${user.user_full_name}</h3>
                        <div class="user-buttons">
                            <button class="edit-button">Редактировать</button>
                            <button class="delete-button">Удалить</button>
                            <button class="toggle-details">Больше информации</button>
                        </div>
                    </div>
                    <div class="edit-user-form edit-item-form">
                        <h3 class="filter-title">Редактирование пользователя</h3>
                        <form class="filter-form">
                            <div class="input-group">
                                <label for="edit-name">ФИО</label>
                                <input type="text" id="edit-name" name="full_name" placeholder="Введите ФИО пользователя" value="${user.user_full_name}" required>
                            </div>
                            <div class="input-group">
                                <label for="edit-author">Студенческий билет</label>
                                <input type="text" id="edit-author" name="student_id" placeholder="Введите номер студенческого билета пользователя" value="${user.student_id_number}" maxlength="10" minlength="10" required>
                            </div>
                            <div class="input-group">
                                <label for="edit-year">Группа</label>
                                <input type="text" id="edit-year" name="group" placeholder="Введите группу пользователя" value="${user.group_name}" required>
                            </div>
                            <div class="input-group">
                                <label for="edit-udk">Курс</label>
                                <input type="text" id="edit-udk" name="year" placeholder="Введите номер курса пользователя" value="${user.year_of_studying}" required>
                            </div>
                            <div class="filter-buttons">
                                <button type="button" class="filter-button hide-button hide-edit-button">Отмена</button>
                                <button type="submit" class="filter-button apply-button">Сохранить</button>
                                <button type="reset" class="filter-button reset-button">Сбросить</button>
                            </div>
                        </form>
                    </div>
                    <div class="user-details item-details">
                        <hr class="line">
                        <div class="user-description">
                            <div>Почта: ${user.email}</div>
                            <div>Студенческий билет: ${user.student_id_number}</div>
                            <div>Группа: ${user.group_name}</div>
                            <div>Курс: ${user.year_of_studying}</div>
                        </div>
                    </div>
    `;

    // Обработчик кнопки "Больше информации"
    userItem.querySelector('.toggle-details').addEventListener('click', function () {
        const details = userItem.querySelector(".item-details");
        details.style.display = details.style.display === "block" ? "none" : "block";
        this.textContent = details.style.display === "block" ? "Скрыть информацию" : "Больше информации";
    });

    // Обработчик кнопки "Редактировать"
    userItem.querySelector('.edit-button').addEventListener('click', function () {
        const details = userItem.querySelector(".item-details");
        userItem.querySelector('.edit-user-form').style.display = "block";
        userItem.querySelector('.item-cover').style.display = "none";
        details.style.display = "none";
    });

    // Обработчик кнопки "Отмена" в форме редактирования
    userItem.querySelector('.hide-edit-button').addEventListener('click', function () {
        const form = userItem.querySelector('.edit-item-form form');
        form.reset(); // Сбросить данные в полях формы
        userItem.querySelector('.edit-user-form').style.display = "none";
        userItem.querySelector('.item-cover').style.display = "flex";
        userItem.querySelector('.toggle-details').textContent = "Больше инфомрации";
    });

    // Обработчик формы редактирования книги
    userItem.querySelector('.edit-item-form form').addEventListener('submit', async function (event) {
        event.preventDefault();

        // Проверка на пустые строки
        const inputs = userItem.querySelectorAll('.edit-item-form input[type="text"], .edit-item-form input[type="number"]');
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

        await updateUser(userItem);
    });

    // Обработчик кнопки "Сбросить" в форме редактирования
    userItem.querySelector('.edit-item-form form').addEventListener('reset', function () {
        const inputs = userItem.querySelectorAll('.edit-item-form input[type="text"], .edit-item-form input[type="number"]');
        inputs.forEach(input => {
            input.setCustomValidity(""); // Сбрасываем кастомное сообщение об ошибке
            input.reportValidity(); // Обновляем состояние валидации
        });
    });

    // Обработчик кнопки "Удалить"
    userItem.querySelector('.delete-button').addEventListener('click', async function () {
        await initDeleteItem(userItem);
    });

    return userItem;
}

async function updateUser(userItem) {
    const userEmail = userItem.dataset.email;
    const form = userItem.querySelector('.edit-item-form form');

    const formData = new FormData(form);
    const updatedUser = {
        user_full_name: formData.get("full_name").trim(),
        student_id_number: formData.get("student_id").trim(),
        group_name: formData.get("group").trim(),
        year_of_studying: formData.get("year").trim()
    };

    // Проверка: существует ли пользователь с таким же student_id_number
    try {
        const usersResponse = await fetch(`http://localhost:3000/api/user/users`);
        const users = await usersResponse.json();

        const duplicate = users.find(user =>
            user.student_id_number === updatedUser.student_id_number &&
            user.email !== userEmail // Исключаем текущего пользователя
        );

        if (duplicate) {
            const idInput = form.querySelector('[name="student_id"]');
            idInput.setCustomValidity("Пользователь с таким номером студенческого билета уже существует.");
            idInput.reportValidity();

            idInput.addEventListener("input", function () {
                idInput.setCustomValidity("");
            });
            return;
        }
    } catch (error) {
        console.error("Ошибка при проверке уникальности номера:", error);
    }

    try {
        const response = await fetch(`http://localhost:3000/api/user/users/${userEmail}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updatedUser)
        });

        if (!response.ok) {
            const groupInput = form.querySelector('[name="group"]');
            groupInput.setCustomValidity("Группа не найдена.");
            groupInput.reportValidity();

            groupInput.addEventListener("input", function () {
                groupInput.setCustomValidity("");
            });
            throw new Error('Ошибка при обновлении пользователя');
        }

        console.log("Данные обновлены успешно");
        await fetchUsers();

    } catch (error) {
        console.error('Ошибка:', error.message);
    }
}


async function initDeleteItem(userItem) {
    const studentId = userItem.querySelector('.user-cover').dataset.studentId;
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
            const response = await fetch(`http://localhost:3000/api/user/users/${studentId}`, {
                method: 'DELETE'
            });
            const text = await response.text();
            console.log("Ответ сервера:", response.status, text);

            if (!response.ok) {
                throw new Error("Ошибка при удалении пользователя");
            }

            console.log(`Пользователь со студенческим билетом ${studentId} удален`);
            userItem.remove(); // Удаление элемента из списка
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
        } else {
            clearSearch.style.display = 'none'; // Скрываем крестик
        }
    });

    // Обработчик клика на крестик
    clearSearch.addEventListener('click', function () {
        searchInput.value = ''; // Очищаем поле
        clearSearch.style.display = 'none'; // Скрываем крестик
        fetchUsers(); // Перезагружаем книги (без поискового запроса)
    });

    // Обработчик клика на кнопку "Поиск"
    searchButton.addEventListener('click', function () {
        const searchText = searchInput.value.toLowerCase().trim();

        // Передаем поисковый запрос и пустой объект фильтров
        fetchUsers(searchText, {});
    });
}

function initFilter() {
    const filterForm = document.querySelector('.filter-form');

    if (filterForm) {
        filterForm.addEventListener('submit', function (event) {
            event.preventDefault(); // Предотвращаем отправку формы

            // Собираем данные из формы
            const filterData = {
                user_email: filterForm.querySelector('#email').value.trim(),
                id_number: filterForm.querySelector('#student_id_number').value.trim(),
                group: filterForm.querySelector('#group').value.trim(),
                year: filterForm.querySelector('#year').value.trim(),
            };

            // Получаем текущий поисковый запрос
            const searchInput = document.querySelector('.search-input');
            const searchText = searchInput.value.trim();

            // Передаем поисковый запрос и данные фильтра в fetchBooks
            fetchUsers(searchText, filterData);
        });

        // Обработчик кнопки "Сбросить"
        filterForm.addEventListener('reset', function () {
            // Получаем текущий поисковый запрос
            const searchInput = document.querySelector('.search-input');
            const searchText = searchInput.value.trim();

            // Передаем поисковый запрос и пустой объект фильтров
            fetchUsers(searchText, {});
        });
    }
}