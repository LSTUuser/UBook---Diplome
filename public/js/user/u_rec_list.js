import { initPagination } from '../pagination.js';
import { checkUnreadNotifications } from '../checkUnredNotif.js';
document.addEventListener("DOMContentLoaded", async function () {
    await checkUnreadNotifications();
    // Группировка функций
    fetchBooks().then(() => {
        initPagination(); // Вызови пагинацию после загрузки книг
        // initSearch();
    });
    // initFilter();
    initDropdown();
});