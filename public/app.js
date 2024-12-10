document.addEventListener('DOMContentLoaded', function () {
    const dropdownToggle = document.querySelector('.dropdown-toggle'); // Находим элемент toggle
    const dropdownMenu = document.querySelector('.dropdown-menu'); // Находим меню

    dropdownToggle.addEventListener('click', function (event) {
        event.preventDefault(); // Предотвращаем стандартное поведение (если есть)
        dropdownMenu.style.display = dropdownMenu.style.display === 'block' ? 'none' : 'block'; // Переключаем видимость меню
    });

    // Закрытие меню при клике вне
    document.addEventListener('click', function (event) {
        if (!dropdownToggle.contains(event.target) && !dropdownMenu.contains(event.target)) {
            dropdownMenu.style.display = 'none'; // Скрываем меню, если кликнули вне
        }
    });
});

document.addEventListener("DOMContentLoaded", function () {
    const buttons = document.querySelectorAll(".toggle-details");

    buttons.forEach(button => {
        button.addEventListener("click", function () {
            const details = this.nextElementSibling;
            if (details.style.display === "block") {
                details.style.display = "none";
                this.textContent = "Больше информации";
            } else {
                details.style.display = "block";
                this.textContent = "Скрыть информацию";
            }
        });
    });
});

document.addEventListener("DOMContentLoaded", function() {
    // Находим элементы
    const filterTitleMain = document.querySelector(".filter-title-main"); // Заголовок для клика
    const filter = document.querySelector(".filter-header"); // Верхняя панель с заголовком
    const bookFilter = document.querySelector(".book-filter"); // Форма фильтра
    const hideButton = document.querySelector(".hide-button"); // Кнопка "Скрыть"

    // Обработчик клика по заголовку
    if (filterTitleMain) {
        filterTitleMain.addEventListener("click", function() {
            // Переключаем видимость формы фильтра
            if (bookFilter.style.display === "none" || bookFilter.style.display === "") {
                bookFilter.style.display = "flex";  // Показываем форму
                filter.style.display = "none";  // Скрываем фильтр
            } else {
                bookFilter.style.display = "none";  // Скрываем форму
                filter.style.display = "flex";  // Показываем фильтр
            }
        });
    } else {
        console.error("Не найден элемент filter-title-main");
    }

    // Обработчик клика по кнопке "Скрыть"
    if (hideButton) {
        hideButton.addEventListener("click", function() {
            bookFilter.style.display = "none";  // Скрываем форму фильтра
            filter.style.display = "flex";  // Показываем фильтр
        });
    } else {
        console.error("Не найдена кнопка скрыть");
    }
});
