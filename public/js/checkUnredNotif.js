export async function checkUnreadNotifications() {
    console.log('checkUnreadNotifications вызвана!');
    try {
        const res = await fetch('/api/notification/notifications', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (!res.ok) throw new Error('Ошибка при проверке уведомлений');

        const notifications = await res.json();
        const navLink = document.getElementById('nav-notifications-link');

        if (navLink) {
            const hasUnread = notifications.some(n => !n.is_read);
            if (hasUnread) {
                navLink.classList.add('nav-link-notification-indicator');
            } else {
                navLink.classList.remove('nav-link-notification-indicator');
            }
        }

    } catch (err) {
        console.error('Ошибка при проверке непрочитанных уведомлений:', err);
    }
}
