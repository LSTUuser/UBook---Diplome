import { checkUnreadNotifications } from '../checkUnredNotif.js';
document.addEventListener("DOMContentLoaded", async function () {
    initDropdown();
    await checkUnreadNotifications();
    await loadNotifications();
});

async function loadNotifications() {
    try {
        const res = await fetch('/api/notification/notifications', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (!res.ok) throw new Error('Ошибка при загрузке уведомлений');

        const notifications = await res.json();
        console.log(notifications);
        const container = document.querySelector('.notifications-list');
        container.innerHTML = '';

        notifications.forEach(n => {
            const el = renderNotification(n);
            container.appendChild(el);
        });

    } catch (err) {
        console.error(err);
    }
}

function renderNotification(n) {
    const el = document.createElement('div');
    el.className = 'notification';
    if (!n.is_read) el.classList.add('unread');

    el.innerHTML = `
        <img src="/images/notification_logo.png" class="notification-logo" alt="logo">
        <div class="notification-info">
            <h3 class="notification-name">${getTitle(n.return_date)}</h3>
            <p class="notification-description">${getDescription(n.return_date, n.book_name)}</p>
        </div>
    `;

    el.addEventListener('mouseenter', () => markAsRead(n.issuance_id, el));
    return el;
}

function getTitle(returnDateStr) {
    const now = new Date();
    const returnDate = new Date(returnDateStr);
    const diff = (returnDate - now) / (1000 * 60 * 60 * 24); // в днях

    if (diff < 0) return 'Книга просрочена!';
    if (diff <= 3) return 'Срок сдачи книги подходит к концу!';
    return 'Оповещение';
}

function getDescription(returnDateStr, bookName) {
    const now = new Date();
    const returnDate = new Date(returnDateStr);
    const diff = (returnDate - now) / (1000 * 60 * 60 * 24); // в днях
    const date = new Date(returnDateStr).toLocaleDateString('ru-RU');

    if (diff < 0) {
        // Описание для просроченной книги
        return `Книга "${bookName}" просрочена! Срок сдачи был ${date}. Пожалуйста, верните книгу как можно скорее.`;
    } else if (diff <= 3) {
        // Описание для книги, срок сдачи которой близок
        return `Не забудьте сдать книгу "${bookName}" в библиотеку. Срок сдачи: ${date}.`;
    }
}

function markAsRead(id, el) {
    fetch(`/api/notification/notifications/${id}/read`, {
        method: 'PUT',
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
    }).then(async res => {
        if (res.ok) { 
            el.classList.remove('unread');
            await checkUnreadNotifications();
        }
    }).catch(err => console.error('Ошибка при отметке прочитанного:', err));
}