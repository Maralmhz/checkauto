// ============================================
// LOGIN FORM HANDLER
// ============================================
const loginForm = document.getElementById('loginForm');
const btnText = document.getElementById('btnText');
const btnLoader = document.getElementById('btnLoader');

loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const remember = document.getElementById('remember').checked;
    
    // Validação básica
    if (!email || !password) {
        showError('Preencha todos os campos!');
        return;
    }
    
    // Mostrar loading
    btnText.style.display = 'none';
    btnLoader.style.display = 'inline-block';
    loginForm.querySelector('.btn-login').disabled = true;
    
    // Simular delay de autenticação (mockado)
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Login sempre aceito (mockado)
    const userData = {
        email: email,
        name: email.split('@')[0].charAt(0).toUpperCase() + email.split('@')[0].slice(1),
        role: 'Administrador',
        loginTime: new Date().toISOString(),
        remember: remember
    };
    
    // Salvar sessão
    if (remember) {
        localStorage.setItem('perplexity_user', JSON.stringify(userData));
    } else {
        sessionStorage.setItem('perplexity_user', JSON.stringify(userData));
    }
    
    // Redirecionar para o sistema
    window.location.href = 'index.html';
});

// ============================================
// TOGGLE PASSWORD VISIBILITY
// ============================================
function togglePassword() {
    const passwordInput = document.getElementById('password');
    const eyeIcon = document.getElementById('eyeIcon');
    
    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        eyeIcon.classList.remove('fa-eye');
        eyeIcon.classList.add('fa-eye-slash');
    } else {
        passwordInput.type = 'password';
        eyeIcon.classList.remove('fa-eye-slash');
        eyeIcon.classList.add('fa-eye');
    }
}

// ============================================
// ERROR MESSAGE
// ============================================
function showError(message) {
    alert(message); // Temporário, depois vamos criar toast notification
}

// ============================================
// CHECK IF ALREADY LOGGED IN
// ============================================
window.addEventListener('DOMContentLoaded', () => {
    const user = localStorage.getItem('perplexity_user') || sessionStorage.getItem('perplexity_user');
    
    if (user) {
        // Já está logado, redirecionar
        window.location.href = 'index.html';
    }
    
    console.log('🔐 Sistema de Login - FASE 2');
});

// ============================================
// FORGOT PASSWORD (MOCKADO)
// ============================================
document.querySelector('.forgot-password').addEventListener('click', (e) => {
    e.preventDefault();
    alert('🚧 Funcionalidade em desenvolvimento!\n\nPor enquanto, use qualquer e-mail e senha para entrar.');
});