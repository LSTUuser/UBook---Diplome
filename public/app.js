document.addEventListener("DOMContentLoaded", function () {
    // Группировка функций
    initDropdown();
    initToggleDetails();
    initFilterToggle();
    initPagination();
    initEditItemMenu();
    initDeleteItem();
    initAddItem();
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

function initToggleDetails() {
    const buttons = document.querySelectorAll(".toggle-details");

    buttons.forEach(button => {
        button.addEventListener("click", function () {
            const item = this.closest('.item');
            const details = item.querySelector(".item-details");
            if (details) {
                details.style.display = details.style.display === "block" ? "none" : "block";
                this.textContent = details.style.display === "block" ? "Скрыть информацию" : "Больше информации";
            }
        });
    });
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

function initEditItemMenu() {
    const editButtons = document.querySelectorAll(".edit-button");

    editButtons.forEach(editButton => {
        editButton.addEventListener("click", function () {
            const user = this.closest('.item'); // Находим контейнер пользователя
            const editItemMenu = user.querySelector(".edit-item-form"); // Меню редактирования этого пользователя
            const editItem = user.querySelector(".item-cover"); // Отображение этого пользователя

            // Переключение видимости меню и информации
            const isHidden = editItemMenu.style.display === "none" || editItemMenu.style.display === "";
            editItemMenu.style.display = isHidden ? "flex" : "none";
            editItem.style.display = isHidden ? "none" : "flex";
        });
    });

    const hideButtons = document.querySelectorAll(".hide-edit-button");

    hideButtons.forEach(hideButton => {
        hideButton.addEventListener("click", function () {
            const user = this.closest('.item'); // Находим контейнер пользователя
            const editItemMenu = user.querySelector(".edit-item-form"); // Меню редактирования этого пользователя
            const editItem = user.querySelector(".item-cover"); // Отображение этого пользователя

            // Скрытие меню и показ информации
            editItemMenu.style.display = "none";
            editItem.style.display = "flex";
        });
    });
}



function initDeleteItem() {
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
}

function initAddItem() {
   // Получаем элементы
const modal = document.getElementById("addItemModal");
const openModalButton = document.getElementById("openModalButton");
const closeModalButton = document.getElementById("closeModalButton");

// Открыть модальное окно
openModalButton.onclick = function() {
    modal.style.display = "flex";
}

// Закрыть модальное окно
closeModalButton.onclick = function() {
    modal.style.display = "none";
}

// Закрыть модальное окно, если пользователь кликнул вне окна
window.onclick = function(event) {
    if (event.target == modal) {
        modal.style.display = "none";
    }
}
}