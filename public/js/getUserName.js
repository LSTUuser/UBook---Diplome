async function loadUserInfo(forceRefresh = false) {
    try {
        // Если нужно принудительное обновление, сначала обновляем токен
        if (forceRefresh) {
            await fetch('/api/auth/refresh-token', {
                method: 'POST',
                credentials: 'include'
            });
        }

        const response = await fetch('/api/auth/check', {
            method: 'GET',
            credentials: 'include'
        });

        if (!response.ok) {
            throw new Error('Ошибка при проверке авторизации');
        }

        const data = await response.json();

        if (data.isAuthenticated) {
            updateUserInfo(data.user);
        }
    } catch (error) {
        console.error('Ошибка загрузки информации о пользователе:', error);
    }
}

function updateUserInfo(user) {
    const headerNameElement = document.getElementById('user-name');
    const bodyNameElement = document.getElementById('user-name-body');
    const groupNameElement = document.getElementById('group-name');

    if (headerNameElement) {
        headerNameElement.textContent = user.fullName || 'Пользователь';
    }
    if (bodyNameElement) {
        bodyNameElement.textContent = user.fullName || 'Пользователь';
    }
    if (groupNameElement) {
        groupNameElement.textContent = user.group || 'Группа не указана';
    }
}

// Обновляем при загрузке страницы
window.addEventListener('DOMContentLoaded', () => loadUserInfo());