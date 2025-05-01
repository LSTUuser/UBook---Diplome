import { initPagination } from '../pagination.js';
document.addEventListener("DOMContentLoaded", function () {
    // Группировка функций
    fetchBooks().then(() => {
        initPagination(); // Вызови пагинацию после загрузки книг
        // initSearch();
    });
    // initFilter();
    initDropdown();
});