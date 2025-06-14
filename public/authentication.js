document.addEventListener('DOMContentLoaded', async function () {
    const registerForm = document.getElementById('registerForm');

    if (registerForm) {
        let validGroups = []; // Список допустимых групп
        let validIdNums = [];
        let validEmails = [];
        // Загружаем список групп с сервера
        try {
            const response = await fetch('/api/groups');
            const result = await response.json();

            if (result.success) {
                validGroups = result.groups; // Сохраняем список групп
            } else {
                console.error('Ошибка при загрузке списка групп:', result.message);
            }
        } catch (error) {
            console.error('Ошибка при загрузке списка групп:', error);
        }

        try {
            const response = await fetch('/api/id_number');
            const result = await response.json();

            if (result.success) {
                validIdNums = result.id_numbers; // Сохраняем список номеров студ билетов
            } else {
                console.error('Ошибка при загрузке списка номеров студ билетов:', result.message);
            }
        } catch (error) {
            console.error('Ошибка при загрузке списка номеров студ билетов:', error);
        }

        try {
            const response = await fetch('/api/email');
            const result = await response.json();

            if (result.success) {
                validEmails = result.emails; // Сохраняем список групп
            } else {
                console.error('Ошибка при загрузке списка групп:', result.message);
            }
        } catch (error) {
            console.error('Ошибка при загрузке списка групп:', error);
        }

        // Обработчик для поля "ФИО"
        const fullnameInput = document.getElementById('fullname');
        if (fullnameInput) {
            fullnameInput.addEventListener('input', function () {
                // Удаляем все цифры из введенного текста
                this.value = this.value.replace(/[0-9]/g, '');
            });
        }

        registerForm.addEventListener('submit', async function (event) {
            event.preventDefault(); // Предотвращаем стандартную отправку формы

            // Очищаем предыдущие ошибки
            const inputs = this.querySelectorAll('input');
            inputs.forEach(input => input.setCustomValidity(''));

            // Получаем данные из формы
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const fullname = document.getElementById('fullname').value;
            const idCard = document.getElementById('idCard').value;
            const group = document.getElementById('group-select').value;
            const year = document.getElementById('year').value;

            let hasErrors = false; // Флаг для отслеживания ошибок

            // Проверка формата email
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                document.getElementById('email').setCustomValidity('Некорректный формат email');
                hasErrors = true;
            }

            // Проверка длины номера студенческого билета
            if (idCard.length !== 10) {
                document.getElementById('idCard').setCustomValidity('Номер студенческого билета должен содержать 10 символов');
                hasErrors = true;
            }

            // Проверка группы
            if (!validGroups.includes(group)) {
                console.log(validGroups);
                document.getElementById('group').setCustomValidity('Указанная группа не существует');
                hasErrors = true;
            }

            if (validIdNums.includes(idCard)) {
                document.getElementById('idCard').setCustomValidity('Студенческий билет уже зарегистрирован');
                hasErrors = true;
            }

            if (validEmails.includes(email)) {
                document.getElementById('email').setCustomValidity('Пользователь с данным email уже зарегестрирован');
                hasErrors = true;
            }

            // Если есть ошибки, останавливаем выполнение
            if (hasErrors) {
                registerForm.reportValidity(); // Показываем ошибки
                return;
            }

            // Если все проверки пройдены, отправляем данные на сервер
            const formData = new FormData(this);
            const response = await fetch('api/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(Object.fromEntries(formData))
            });

            const result = await response.json();

            if (result.success) {
                window.location.href = 'reg_success.html'; // Перенаправляем на страницу успеха
            } else {
                // Обработка ошибок сервера
                if (result.message.includes('email')) {
                    document.getElementById('email').setCustomValidity(result.message);
                } else if (result.message.includes('группа')) {
                    document.getElementById('group').setCustomValidity(result.message);
                } else {
                    alert(result.message); // Общая ошибка
                }
                registerForm.reportValidity();
            }
        });

        // Очищаем сообщения об ошибках при изменении полей
        document.querySelectorAll('#registerForm input').forEach(input => {
            input.addEventListener('input', function () {
                this.setCustomValidity('');
            });
        });
    }
});

document.addEventListener('DOMContentLoaded', async function () {
    const loginForm = document.getElementById('loginForm');

    if (loginForm) {

        let validEmails = [];

        try {
            const response = await fetch('/api/email');
            const result = await response.json();

            if (result.success) {
                validEmails = result.emails; // Сохраняем список групп
            } else {
                console.error('Ошибка при загрузке списка групп:', result.message);
            }
        } catch (error) {
            console.error('Ошибка при загрузке списка групп:', error);
        }


        loginForm.addEventListener('submit', async function (event) {
            event.preventDefault(); // Предотвращаем стандартную отправку формы

            // Очищаем предыдущие ошибки
            const inputs = this.querySelectorAll('input');
            inputs.forEach(input => input.setCustomValidity(''));

            // Получаем данные из формы
            const email = document.getElementById('email').value.trim();
            const password = document.getElementById('password').value.trim();

            let hasErrors = false;
            
            if (!validEmails.includes(email)) {
                console.log(validEmails);
                document.getElementById('email').setCustomValidity('Пользователь с данным email не существует');
                hasErrors = true;
            }

            // Если есть ошибки, останавливаем выполнение
            if (hasErrors) {
                loginForm.reportValidity();
                return;
            }

            // Отправка данных на сервер
            try {
                const response = await fetch('/api/auth/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password })
                });

                const result = await response.json();

                if (result.success) {
                    if (result.user.is_admin) {
                        window.location.href = '/admin/dashboard.html';
                    } else {
                        window.location.href = '/user/dashboard.html';
                    }
                } else {
                    // Обработка ошибок
                    if (response.status === 401) {
                        document.getElementById('password').setCustomValidity('Неверный пароль');
                    } else {
                        alert('Ошибка сервера, попробуйте позже.');
                    }
                    loginForm.reportValidity();
                }
            } catch (error) {
                console.error('Ошибка при входе:', error);
                alert('Ошибка сервера, попробуйте позже.');
            }
        });

        // Очистка ошибок при вводе
        document.querySelectorAll('input').forEach(input => {
            input.addEventListener('input', function () {
                this.setCustomValidity('');
            });
        });
    }
});

// Обработчик выхода
document.addEventListener('DOMContentLoaded', () => {
    const logoutBtn = document.getElementById('logoutBtn');
    
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            console.log('Нажата кнопка выхода'); // Для отладки
            
            try {
                const response = await fetch('/api/auth/logout', {
                    method: 'POST',
                    credentials: 'include' // Важно для работы с cookies
                });
                
                console.log('Ответ сервера:', response.status); // Для отладки
                
                if (response.ok) {
                    window.location.href = '/login.html';
                } else {
                    alert('Ошибка при выходе');
                }
            } catch (error) {
                console.error('Ошибка:', error);
                alert('Не удалось выполнить выход');
            }
        });
    }
});

// Функция для проверки аутентификации
async function checkAuth() {
    try {
        const response = await fetch('/api/auth/check', {
            credentials: 'include' // Важно для отправки cookies
        });
        return await response.json();
    } catch (error) {
        console.error('Ошибка проверки аутентификации:', error);
        return { isAuthenticated: false };
    }
}

// Пример использования на защищенных страницах
document.addEventListener('DOMContentLoaded', async () => {
    const protectedPaths = ['/admin/', '/user/'];
    const isProtected = protectedPaths.some(path => 
        window.location.pathname.startsWith(path)
    );

    if (isProtected) {
        const authStatus = await checkAuth();
        
        if (!authStatus.isAuthenticated) {
            window.location.href = '/login.html';
            return;
        }

        // Явная проверка is_admin для админских путей
        if (window.location.pathname.startsWith('/admin/') && !authStatus.user?.is_admin) {
            window.location.href = '/user/dashboard.html';
        }
    }
});

document.addEventListener('DOMContentLoaded', async function () {
    const groupSelect = document.getElementById('group-select');
    if (groupSelect) {
        try {
            const response = await fetch('/api/groups');
            const result = await response.json();

            if (result.success) {
                // Сортируем группы алфавитно
                const sortedGroups = result.groups.sort((a, b) => a.localeCompare(b));
                
                // Очищаем и заполняем select
                groupSelect.innerHTML = '<option value="" disabled selected>Выберите группу</option>';
                sortedGroups.forEach(group => {
                    const option = new Option(group, group);
                    groupSelect.add(option);
                });
            }
        } catch (error) {
            console.error('Ошибка:', error);
        }
    }
});

// Добавляем новую функцию для загрузки данных профиля
async function loadProfileData() {
    try {
        const response = await fetch('/api/user/profile', {
            credentials: 'include'
        });
        return await response.json();
    } catch (error) {
        console.error('Ошибка при загрузке данных профиля:', error);
        return null;
    }
}

document.addEventListener('DOMContentLoaded', async function () {
    if (window.location.pathname.includes('/user/edit_profile.html')) {
        // Загружаем данные профиля
        const profileData = await loadProfileData();
        console.log('Данные профиля:', profileData);
        
        if (profileData?.success) {
            // Заполняем поля формы
            document.getElementById('fullname').value = profileData.user?.fullName || '';
            document.getElementById('id-card').value = profileData.user?.idCard || '';
            
            // Загружаем список групп
            const groupSelect = document.getElementById('group-select');
            try {
                const response = await fetch('/api/groups');
                const result = await response.json();

                if (result.success) {
                    groupSelect.innerHTML = '<option value="" disabled>Выберите группу</option>';
                    // Сортируем группы
                    const sortedGroups = result.groups?.sort() || [];
                    // Добавляем группы в select
                    sortedGroups.forEach(group => {
                        if (!group) return; // Пропускаем пустые значения
                        
                        const option = new Option(group, group);
                        
                        // Устанавлием выбранной текущую группу пользователя
                        const userGroup = profileData.user?.group || '';
                        if (group.trim().toLowerCase() === userGroup.trim().toLowerCase()) {
                            option.selected = true;
                        }
                        groupSelect.add(option);
                    });
                    
                    // Если группа не установилась, попробуем найти похожую
                    if (!groupSelect.value && profileData.user?.group) {
                        const userGroup = profileData.user.group;
                        const similarGroup = sortedGroups.find(g => 
                            g && userGroup && (
                                g.includes(userGroup) || 
                                userGroup.includes(g)
                        ));
                        
                        if (similarGroup) {
                            groupSelect.value = similarGroup;
                        }
                    }
                }
            } catch (error) {
                console.error('Ошибка загрузки групп:', error);
            }
        }

        // Получаем список всех пользователей для проверки уникальности студенческого билета
        let allUsers = [];
        try {
            const usersResponse = await fetch('/api/user/users');
            const usersResult = await usersResponse.json();
            if (usersResult && Array.isArray(usersResult)) {
                allUsers = usersResult;
            }
        } catch (error) {
            console.error('Ошибка загрузки списка пользователей:', error);
        }

        // Проверка уникальности студенческого билета при изменении
        const idCardInput = document.getElementById('id-card');
        if (idCardInput) {
            // Функция проверки уникальности
            const validateIdCard = () => {
                const currentIdCard = idCardInput.value?.trim() || '';
                const originalIdCard = profileData?.user?.idCard?.trim() || '';
                
                // Если номер изменился и не пустой
                if (currentIdCard && currentIdCard !== originalIdCard) {
                    const isDuplicate = allUsers.some(user => 
                        user?.student_id_number && 
                        user.student_id_number.trim().toLowerCase() === currentIdCard.toLowerCase()
                    );
                    
                    if (isDuplicate) {
                        idCardInput.setCustomValidity('Этот номер студенческого билета уже используется');
                        return false;
                    }
                }
                idCardInput.setCustomValidity('');
                return true;
            };

            // Проверяем при каждом изменении
            idCardInput.addEventListener('input', function() {
                validateIdCard();
                // Принудительно обновляем состояние валидации
                idCardInput.reportValidity();
            });

            // Также проверяем при потере фокуса
            idCardInput.addEventListener('blur', validateIdCard);
        }

        // Обработчик отправки формы
        const editForm = document.querySelector('.edit-container form');
        if (editForm) {
            editForm.addEventListener('submit', async function (e) {
                e.preventDefault();
                
                // Проверяем валидность перед отправкой
                if (idCardInput && !idCardInput.checkValidity()) {
                    idCardInput.reportValidity();
                    return;
                }
                
                try {
                    const response = await fetch('/api/user/update_profile', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            fullname: document.getElementById('fullname')?.value || '',
                            idCard: document.getElementById('id-card')?.value || '',
                            group: document.getElementById('group-select')?.value || ''
                        }),
                        credentials: 'include'
                    });
                    
                    const result = await response.json();
                    
                    if (result.success) {
                        // Показываем сообщение на 1.5 секунды перед переадресацией
                        const message = document.createElement('div');
                        message.textContent = 'Данные успешно обновлены!';
                        message.style.position = 'fixed';
                        message.style.bottom = '20px';
                        message.style.right = '20px';
                        message.style.padding = '10px 20px';
                        message.style.background = '#4CAF50';
                        message.style.color = 'white';
                        message.style.borderRadius = '5px';
                        message.style.zIndex = '1000';
                        document.body.appendChild(message);

                        setTimeout(() => {
                            window.location.href = '/user/dashboard.html';
                        }, 1500);
                    } else {
                        alert('Ошибка: ' + (result.message || 'Неизвестная ошибка'));
                    }
                } catch (error) {
                    console.error('Ошибка:', error);
                    alert('Ошибка сети при обновлении данных');
                }
            });
        }
    }
});