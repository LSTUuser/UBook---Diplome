async function loadUserInfo() {
    try {
        const response = await fetch('/api/auth/check', {
            method: 'GET',
            credentials: 'include' // обязательно для отправки cookie
        });

        if (!response.ok) {
            throw new Error('Ошибка при проверке авторизации');
        }

        const data = await response.json();

        if (data.isAuthenticated) {
            const headerNameElement = document.getElementById('user-name');
            const bodyNameElement = document.getElementById('user-name-body');

            if (headerNameElement) {
                headerNameElement.textContent = data.user.fullName;
            }
            if (bodyNameElement) {
                bodyNameElement.textContent = data.user.fullName;
            }
        }
    } catch (error) {
        console.error('Ошибка загрузки информации о пользователе:', error);
    }
}

window.addEventListener('DOMContentLoaded', loadUserInfo);