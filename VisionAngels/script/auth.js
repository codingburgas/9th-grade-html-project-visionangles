export function togglePassword(inputId = 'password') {
    const passwordInput = document.getElementById(inputId);
    const toggleBtn = passwordInput.parentElement.querySelector('.password-toggle');

    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        toggleBtn.textContent = '🙈';
    } else {
        passwordInput.type = 'password';
        toggleBtn.textContent = '👁';
    }
}

export function createFireParticles() {
    const particleContainer = document.getElementById('fireParticles');
    const particleCount = 25;

    for (let i = 0; i < particleCount; i++) {
        createParticle(particleContainer);
    }

    setInterval(() => {
        if (document.querySelectorAll('.particle').length < particleCount) {
            createParticle(particleContainer);
        }
    }, 200);
}

function createParticle(container) {
    const particle = document.createElement('div');
    particle.className = 'particle';

    const size = Math.random();
    if (size < 0.3) {
        particle.classList.add('small');
    } else if (size > 0.7) {
        particle.classList.add('large');
    }

    particle.style.left = Math.random() * 100 + '%';
    const duration = 6 + Math.random() * 9;
    particle.style.animationDuration = duration + 's';
    particle.style.animationDelay = Math.random() * 2 + 's';

    container.appendChild(particle);

    setTimeout(() => {
        if (particle.parentNode) {
            particle.parentNode.removeChild(particle);
        }
    }, (duration + 2) * 1000);
}

export function validateForm(formType) {
    const form = document.querySelector('form');
    const inputs = form.querySelectorAll('input[required], select[required]');
    let isValid = true;

    inputs.forEach(input => {
        if (!input.value.trim()) {
            input.style.borderColor = 'rgba(255, 0, 0, 0.6)';
            isValid = false;
        } else {
            input.style.borderColor = 'rgba(255, 69, 0, 0.2)';
        }
    });

    if (formType === 'signup') {
        const password = document.getElementById('password');
        const confirmPassword = document.getElementById('confirmPassword');
        if (password.value !== confirmPassword.value) {
            confirmPassword.style.borderColor = 'rgba(255, 0, 0, 0.6)';
            alert('Passwords do not match!');
            isValid = false;
        }
    }

    return isValid;
}

export function initUIEffects() {
    createFireParticles();

    const inputs = document.querySelectorAll('input, select');
    inputs.forEach(input => {
        input.addEventListener('focus', function () {
            this.parentElement.style.transform = 'translateY(-2px)';
        });
        input.addEventListener('blur', function () {
            this.parentElement.style.transform = 'translateY(0)';
        });
        input.addEventListener('input', function () {
            this.style.borderColor = 'rgba(255, 69, 0, 0.2)';
        });
    });

    const buttons = document.querySelectorAll('button');
    buttons.forEach(button => {
        button.addEventListener('click', function (e) {
            if (this.classList.contains('password-toggle')) return;
            const ripple = document.createElement('span');
            const rect = this.getBoundingClientRect();
            const size = Math.max(rect.width, rect.height);
            const x = e.clientX - rect.left - size / 2;
            const y = e.clientY - rect.top - size / 2;

            ripple.style.width = ripple.style.height = size + 'px';
            ripple.style.left = x + 'px';
            ripple.style.top = y + 'px';
            ripple.classList.add('ripple');

            this.appendChild(ripple);
            setTimeout(() => ripple.remove(), 600);
        });
    });
}
