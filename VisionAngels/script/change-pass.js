import { signInWithEmailAndPassword, updatePassword, EmailAuthProvider, reauthenticateWithCredential } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { auth } from "../data/firebase-config.js";
import { initUIEffects } from "./auth.js";

document.addEventListener("DOMContentLoaded", () => {
  initUIEffects();

  const form = document.getElementById("signInForm");
  const email = document.getElementById("email");
  const oldPassword = document.getElementById("oldPassword");
  const newPassword = document.getElementById("newPassword");
  const confirmPassword = document.getElementById("confirmPassword");

  form.addEventListener("submit", async function (e) {
    e.preventDefault();

    if (newPassword.value !== confirmPassword.value) {
      alert("🚫 New password and confirm password do not match.");
      return;
    }

    if (oldPassword.value === newPassword.value) {
      alert("⚠️ New password must be different from the old password.");
      return;
    }

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email.value, oldPassword.value);
      const user = userCredential.user;

      const credential = EmailAuthProvider.credential(email.value, oldPassword.value);
      await reauthenticateWithCredential(user, credential);

      await updatePassword(user, newPassword.value);

      alert("✅ Password changed successfully!");
      window.location.href = "../pages/sign-in.html";
    } catch (error) {
      console.error(error);
      alert("❌ Error: " + error.message);
    }
  });
});
