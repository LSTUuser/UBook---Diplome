export function initPagination(selector = ".item", itemsPerPage = 10) {
    const Items = document.querySelectorAll(selector);
    const ItemsPerPage = itemsPerPage;
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
        const totalPages = Math.max(1, Math.ceil(Items.length / ItemsPerPage)); // Всегда минимум 1 страница
        currentPage = Math.min(currentPage, totalPages); // Не позволяем текущей странице быть больше общего количества
        
        if (pageInfo) {
            pageInfo.textContent = `Страница ${currentPage} из ${totalPages}`;
        }
        
        // Блокируем обе кнопки, если элементов нет
        const noItems = Items.length === 0;
        if (prevPageBtn) prevPageBtn.disabled = noItems || currentPage === 1;
        if (nextPageBtn) nextPageBtn.disabled = noItems || currentPage === totalPages;

        if (pageSelect) {
            pageSelect.innerHTML = "";
            for (let i = 1; i <= totalPages; i++) {
                const option = document.createElement("option");
                option.value = i;
                option.textContent = `Страница ${i}`;
                option.selected = i === currentPage;
                pageSelect.appendChild(option);
            }
            pageSelect.disabled = noItems; // Отключаем select, если элементов нет
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
            const totalPages = Math.max(1, Math.ceil(Items.length / ItemsPerPage));
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