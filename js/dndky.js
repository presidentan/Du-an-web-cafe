const tabLogin = document.getElementById('tab-login');
const tabRegister = document.getElementById('tab-register');
const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');
const statusMessage = document.getElementById('status-message');
const REGEX = {
    username: /^[a-zA-Z0-9_]{4,20}$/,
    email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    password: /^(?=.*[A-Za-z])(?=.*\d).{6,}$/
};
function showError(inputElement, message) {
    const formGroup = inputElement.parentElement;
    const errorSpan = formGroup.querySelector('.error-msg');
    inputElement.classList.add('input-error');
    errorSpan.textContent = message;
}
function clearError(inputElement) {
    const formGroup = inputElement.parentElement;
    const errorSpan = formGroup.querySelector('.error-msg');
    inputElement.classList.remove('input-error');
    if (errorSpan) errorSpan.textContent = '';
}
function showStatus(message, type = 'success') {
    statusMessage.textContent = message;
    statusMessage.className = `status-message ${type}`;
}

function hideStatus() {
    statusMessage.className = 'status-message hidden';
}
function resetAllErrors(form) {
    const inputs = form.querySelectorAll('input');
    inputs.forEach(input => clearError(input));
    hideStatus();
}
tabLogin.addEventListener('click', () => {
    tabLogin.classList.add('active');
    tabRegister.classList.remove('active');
    loginForm.classList.add('active');
    registerForm.classList.remove('active');
    resetAllErrors(loginForm);
});

tabRegister.addEventListener('click', () => {
    tabRegister.classList.add('active');
    tabLogin.classList.remove('active');
    registerForm.classList.add('active');
    loginForm.classList.remove('active');
    resetAllErrors(registerForm);
});

document.querySelectorAll('.auth-form input').forEach(input => {
    input.addEventListener('input', () => clearError(input));
});

registerForm.addEventListener('submit', (e) => {
    e.preventDefault();
    hideStatus();

    const usernameInput = document.getElementById('reg-username');
    const emailInput = document.getElementById('reg-email');
    const passwordInput = document.getElementById('reg-password');
    const confirmPasswordInput = document.getElementById('reg-confirm-password');

    const username = usernameInput.value.trim();
    const email = emailInput.value.trim();
    const password = passwordInput.value;
    const confirmPassword = confirmPasswordInput.value;

    let isValid = true;

    if (!username) {
        showError(usernameInput, 'Vui lòng nhập tên người dùng.');
        isValid = false;
    } else if (!REGEX.username.test(username)) {
        showError(usernameInput, 'Username từ 4-20 ký tự, chỉ gồm chữ, số, dấu gạch dưới.');
        isValid = false;
    }

    if (!email) {
        showError(emailInput, 'Vui lòng nhập địa chỉ email.');
        isValid = false;
    } else if (!REGEX.email.test(email)) {
        showError(emailInput, 'Định dạng email không hợp lệ.');
        isValid = false;
    }

    if (!password) {
        showError(passwordInput, 'Vui lòng nhập mật khẩu.');
        isValid = false;
    } else if (!REGEX.password.test(password)) {
        showError(passwordInput, 'Mật khẩu tối thiểu 6 ký tự, phải có cả chữ và số.');
        isValid = false;
    }

    if (!confirmPassword) {
        showError(confirmPasswordInput, 'Vui lòng xác nhận mật khẩu.');
        isValid = false;
    } else if (confirmPassword !== password) {
        showError(confirmPasswordInput, 'Mật khẩu xác nhận không khớp.');
        isValid = false;
    }

    if (!isValid) return;

    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const isEmailExist = users.some(user => user.email === email);

    if (isEmailExist) {
        showError(emailInput, 'Email này đã được đăng ký.');
        return;
    }

    users.push({ username, email, password });
    localStorage.setItem('users', JSON.stringify(users));

    registerForm.reset();
    showStatus('Đăng ký thành công! Đang chuyển sang trang đăng nhập...', 'success');
    
    setTimeout(() => {
        tabLogin.click();
        hideStatus();
    }, 1200);
});

loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    hideStatus();

    const emailInput = document.getElementById('login-email');
    const passwordInput = document.getElementById('login-password');

    const email = emailInput.value.trim();
    const password = passwordInput.value;

    let isValid = true;

    if (!email) {
        showError(emailInput, 'Vui lòng nhập email.');
        isValid = false;
    } else if (!REGEX.email.test(email)) {
        showError(emailInput, 'Định dạng email không hợp lệ.');
        isValid = false;
    }

    if (!password) {
        showError(passwordInput, 'Vui lòng nhập mật khẩu.');
        isValid = false;
    }

    if (!isValid) return;

    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const matchedUser = users.find(user => user.email === email && user.password === password);

    if (matchedUser) {
        loginForm.reset();
        
        localStorage.setItem('currentUser', JSON.stringify(matchedUser));

        showStatus(`Đăng nhập thành công! Xin chào, ${matchedUser.username}. Đang về trang chủ...`, 'success');
        
        setTimeout(() => {
            window.location.href = 'index.html'; 
        }, 1200);
    } else {
        showStatus('Email hoặc mật khẩu không chính xác!', 'error');
    }
});

// Nút "Đăng ký" ở trang chủ/menu mở thẳng tab đăng ký (dndky.html#register)
if (window.location.hash === '#register') {
    tabRegister.click();
}