document.addEventListener("DOMContentLoaded", function () {
    initDropdown();
    loadNotifications();
    
    // Обновляем уведомления каждые 30 минут
    setInterval(loadNotifications, 1800000);
});

async function loadNotifications() {
    try {
        const response = await fetch('http://localhost:3000/api/notification/notifications', {
            credentials: 'include', // Для передачи cookies
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`Ошибка HTTP: ${response.status}`);
        }

        const notifications = await response.json();
        displayNotifications(notifications);
        
        // Обновляем badge с количеством уведомлений
        updateNotificationBadge(notifications.length);
    } catch (error) {
        console.error('Ошибка при загрузке уведомлений:', error);
        showErrorNotification();
    }
}

function displayNotifications(notifications) {
    const container = document.getElementById('notifications-container');
    
    if (!notifications || notifications.length === 0) {
        container.innerHTML = `
            <div class="notification empty">
                <p>У вас нет новых уведомлений</p>
            </div>
        `;
        return;
    }

    container.innerHTML = notifications.map(notification => `
        <div class="notification ${notification.type}">
            <img src="/images/notification_${notification.type}.png" 
                 alt="${notification.type === 'overdue' ? 'Просрочено' : 'Предупреждение'}" 
                 class="notification-icon">
            <div class="notification-content">
                <h3>${notification.title}</h3>
                <p>${notification.message}</p>
                <small>Срок сдачи: ${new Date(notification.returnDate).toLocaleDateString('ru-RU')}</small>
            </div>
        </div>
    `).join('');
}

function updateNotificationBadge(count) {
    const badge = document.getElementById('notification-badge');
    if (badge) {
        badge.textContent = count > 0 ? count : '';
        badge.style.display = count > 0 ? 'block' : 'none';
    }
}

function showErrorNotification() {
    const container = document.getElementById('notifications-container');
    container.innerHTML = `
        <div class="notification error">
            <img src="/images/notification_error.png" alt="Ошибка" class="notification-icon">
            <div class="notification-content">
                <h3>Ошибка загрузки</h3>
                <p>Не удалось загрузить уведомления. Пожалуйста, попробуйте позже.</p>
            </div>
        </div>
    `;
}