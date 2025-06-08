// register.js
import { auth, db } from "../data/firebase-config.js";
import { createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/11.8.0/firebase-auth.js";
import { doc, setDoc } from "https://www.gstatic.com/firebasejs/11.8.0/firebase-firestore.js";
import { validateForm, initUIEffects } from "./auth.js";

document.addEventListener('DOMContentLoaded', () => {
    initUIEffects();

    const signUpForm = document.getElementById('signUpForm');
    if (signUpForm) {
        signUpForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            if (validateForm('signup')) {
                const firstName = document.getElementById('firstName').value.trim();
                const lastName = document.getElementById('lastName').value.trim();
                const email = document.getElementById('signupEmail').value.trim();
                const phone = document.getElementById('phone').value.trim();
                const role = document.getElementById('role').value;
                const password = document.getElementById('password').value;

                try {
                    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                    const user = userCredential.user;

                    await setDoc(doc(db, "users", user.uid), {
                        firstName,
                        lastName,
                        email: user.email,
                        phone,
                        role,
                        createdAt: new Date().toISOString(),
                    });

                    alert('Registration successful!');
                    window.location.href = '../pages/sign-in.html';  // Redirect to login page
                } catch (error) {
                    console.error("Firebase error:", error);
                    alert("Error: " + error.message);
                }
            }
        });
    }
});
