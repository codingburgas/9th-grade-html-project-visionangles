function togglePassword(inputId = 'password') {
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

function createFireParticles() {
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

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("signInForm");
  const oldPassword = document.getElementById("oldPassword");
  const newPassword = document.getElementById("newPassword");
  const confirmPassword = document.getElementById("confirmPassword");

  form.addEventListener("submit", function (e) {
    e.preventDefault();

    if (oldPassword.value === newPassword.value) {
      alert("⚠️ New password must be different from the old password.");
      return;
    }

    if (newPassword.value !== confirmPassword.value) {
      alert("🚫 New password and confirm password do not match.");
      return;
    }

    alert("✅ Password changed successfully!");
    window.location.href = "../pages/sign-in.html";
  });
});
