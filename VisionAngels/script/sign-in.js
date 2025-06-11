import { auth } from "../data/firebase-config.js";
import { signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/11.8.0/firebase-auth.js";
import { validateForm, initUIEffects } from "./auth.js";

document.addEventListener('DOMContentLoaded', () => {
    initUIEffects();

    const signInForm = document.getElementById('signInForm');
    if (signInForm) {
        signInForm.addEventListener('submit', async function (e) {
            e.preventDefault();
            if (validateForm('signin')) {
                const email = document.getElementById('email').value.trim();
                const password = document.getElementById('password').value;
                try {
                    await signInWithEmailAndPassword(auth, email, password);
                    alert('Sign in successful!');
                    window.location.href = '../index.html';
                } catch (error) {
                    alert("Login failed: " + error.message);
                }
            }
        });
    }
});
