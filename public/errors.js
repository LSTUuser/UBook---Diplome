document.addEventListener('DOMContentLoaded', async function () {
    const registerForm = document.getElementById('registerForm');

    if (registerForm) {
        let validGroups = []; // Список допустимых групп
        let validIdNums = [];
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
            const group = document.getElementById('group').value;

            let hasErrors = false; // Флаг для отслеживания ошибок

            // Проверка наличия всех полей
            if (!email || !password || !fullname || !idCard || !group) {
                alert('Все поля обязательны');
                hasErrors = true;
            }

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

            // Проверка на наличие цифр в ФИО
            const fullnameRegex = /^[а-яА-ЯёЁa-zA-Z\s\-]+$/; // Разрешены только буквы, пробелы и дефисы
            if (!fullnameRegex.test(fullname)) {
                document.getElementById('fullname').setCustomValidity('ФИО не должно содержать цифр или специальных символов');
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

            // Если есть ошибки, останавливаем выполнение
            if (hasErrors) {
                registerForm.reportValidity(); // Показываем ошибки
                return;
            }

            // Если все проверки пройдены, отправляем данные на сервер
            const formData = new FormData(this);
            const response = await fetch('/register', {
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