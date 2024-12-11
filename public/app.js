document.addEventListener("DOMContentLoaded", function () {
    // Группировка функций
    initDropdown();
    initToggleDetails();
    initFilterToggle();
    initPagination();
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
            const details = this.nextElementSibling;
            if (details) {
                details.style.display = details.style.display === "block" ? "none" : "block";
                this.textContent = details.style.display === "block" ? "Скрыть информацию" : "Больше информации";
            }
        });
    });
}

function initFilterToggle() {
    const filterTitleMain = document.querySelector(".filter-title-main");
    const filter = document.querySelector(".filter-header");
    const bookFilter = document.querySelector(".book-filter");
    const hideButton = document.querySelector(".hide-button");

    if (filterTitleMain) {
        filterTitleMain.addEventListener("click", function () {
            const isHidden = bookFilter.style.display === "none" || bookFilter.style.display === "";
            bookFilter.style.display = isHidden ? "flex" : "none";
            filter.style.display = isHidden ? "none" : "flex";
        });
    }

    if (hideButton) {
        hideButton.addEventListener("click", function () {
            bookFilter.style.display = "none";
            filter.style.display = "flex";
        });
    }
}

function initPagination() {
    const books = document.querySelectorAll(".book");
    const booksPerPage = 10;
    let currentPage = 1;

    const prevPageBtn = document.querySelector(".prev-page");
    const nextPageBtn = document.querySelector(".next-page");
    const pageSelect = document.querySelector(".page-select");
    const pageInfo = document.querySelector(".page-info");

    function displayBooks() {
        books.forEach(book => (book.style.display = "none"));

        const startIndex = (currentPage - 1) * booksPerPage;
        const endIndex = startIndex + booksPerPage;
        for (let i = startIndex; i < endIndex && i < books.length; i++) {
            books[i].style.display = "flex";
        }

        updatePagination();
    }

    function updatePagination() {
        const totalPages = Math.ceil(books.length / booksPerPage);
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
                displayBooks();
            }
        });
    }

    if (nextPageBtn) {
        nextPageBtn.addEventListener("click", () => {
            const totalPages = Math.ceil(books.length / booksPerPage);
            if (currentPage < totalPages) {
                currentPage++;
                displayBooks();
            }
        });
    }

    if (pageSelect) {
        pageSelect.addEventListener("change", (e) => {
            currentPage = parseInt(e.target.value);
            displayBooks();
        });
    }

    displayBooks();
}
