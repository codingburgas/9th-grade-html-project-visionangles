// currentUser.js
import { auth } from "../data/firebase-config.js";

// Function to animate text letter by letter with fire-themed effects
function animateText(element, text, delay = 60) {
    element.innerHTML = '';
    element.style.opacity = '1';
    
    const letters = text.split('');
    
    letters.forEach((letter, index) => {
        const span = document.createElement('span');
        span.textContent = letter === ' ' ? '\u00A0' : letter;
        span.style.opacity = '0';
        span.style.transform = 'translateY(15px) scale(0.8)';
        span.style.transition = 'all 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55)';
        span.style.display = 'inline-block';
        span.style.filter = 'blur(2px)';
        
        // Add fire glow effect
        if (letter !== ' ') {
            span.style.textShadow = '0 0 10px rgba(255, 69, 0, 0.8)';
        }
        
        element.appendChild(span);
        
        // Animate each letter with a delay
        setTimeout(() => {
            span.style.opacity = '1';
            span.style.transform = 'translateY(0) scale(1)';
            span.style.filter = 'blur(0)';
            
            // Add a subtle bounce effect
            setTimeout(() => {
                span.style.transform = 'translateY(-2px) scale(1.05)';
                setTimeout(() => {
                    span.style.transform = 'translateY(0) scale(1)';
                }, 150);
            }, 200);
            
        }, index * delay);
    });
}

document.addEventListener('DOMContentLoaded', () => {
    const navCta = document.querySelector('.nav-cta');

    if (!navCta) return; // navbar not present

    auth.onAuthStateChanged(user => {
        if (user) {
            const username = user.email.split('@')[0];
            
            // Create elements
            navCta.innerHTML = `
                <span class="user-greeting" style="opacity: 0; margin-right: 1rem;"></span>
                <a href="#" id="logoutBtn" class="btn-nav btn-secondary">Log out</a>
            `;
            
            const greetingElement = navCta.querySelector('.user-greeting');
            
            setTimeout(() => {
                animateText(greetingElement, `Hi, ${username}`, 70);
            }, 200);

            document.getElementById('logoutBtn').addEventListener('click', async () => {
                // Add fade out animation before logout
                greetingElement.style.transition = 'all 0.3s ease';
                greetingElement.style.opacity = '0';
                greetingElement.style.transform = 'translateX(-10px)';
                
                setTimeout(async () => {
                    await auth.signOut();
                    location.reload();
                }, 300);
            });

        } else {
            // Show original Sign In / Join buttons with fade in
            navCta.innerHTML = `
                <a href="pages/sign-in.html" class="btn-nav btn-secondary" style="opacity: 0; transform: translateX(10px);">Sign In</a>
                <a href="pages/sign-up.html" class="btn-nav btn-primary" style="opacity: 0; transform: translateX(10px);">Join Now</a>
            `;
            
            // Animate buttons in
            const buttons = navCta.querySelectorAll('.btn-nav');
            buttons.forEach((btn, index) => {
                btn.style.transition = 'all 0.4s ease';
                setTimeout(() => {
                    btn.style.opacity = '1';
                    btn.style.transform = 'translateX(0)';
                }, index * 100);
            });
        }
    });
});