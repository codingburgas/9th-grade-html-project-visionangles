import { auth, db } from '../data/firebase-config.js';
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/11.8.0/firebase-auth.js';
import { doc, getDoc, collection, getDocs, deleteDoc, updateDoc } from 'https://www.gstatic.com/firebasejs/11.8.0/firebase-firestore.js';

let currentEditUserId = null;
let currentDeleteUserId = null;
const table = document.getElementById("userTable");
const searchInput = document.getElementById("searchInput");
const exportBtn = document.getElementById("exportBtn");

function createTableRow(id, data) {
  const row = document.createElement("tr");
  row.innerHTML = `
    <td>${data.firstName || ""}</td>
    <td>${data.lastName || ""}</td>
    <td>${data.role || ""}</td>
    <td>${data.phone || ""}</td>
    <td>${data.email || ""}</td>
    <td>
      <div class="action-buttons">
        <button class="edit-btn" onclick="openEditModal('${id}', ${JSON.stringify(data).replace(/"/g, '&quot;')})">✏️ Edit</button>
        <button class="delete-btn" onclick="openDeleteModal('${id}', '${(data.firstName || '') + ' ' + (data.lastName || '')}')">🗑️ Delete</button>
      </div>
    </td>
  `;
  return row;
}

onAuthStateChanged(auth, async () => {
  try {
    const usersSnapshot = await getDocs(collection(db, "users"));
    const tbody = table.querySelector('tbody');
    tbody.innerHTML = ''; // Clear existing rows
    
    usersSnapshot.forEach(docSnap => {
      const row = createTableRow(docSnap.id, docSnap.data());
      tbody.appendChild(row);
    });

  } catch (error) {
    console.error("Error loading users:", error);
    alert("Error loading user data. Please refresh the page.");
  }
});

searchInput.addEventListener("input", () => {
  const query = searchInput.value.toLowerCase();
  const rows = table.querySelectorAll("tbody tr");
  
  rows.forEach(row => {
    const text = row.textContent.toLowerCase();
    row.style.display = text.includes(query) ? "" : "none";
  });
});

exportBtn.addEventListener("click", () => {
  try {
    const doc = new window.jspdf.jsPDF();
    const rows = Array.from(table.querySelectorAll("tr")).map(tr => 
      Array.from(tr.children).slice(0, -1).map(td => td.innerText) // Exclude actions column
    );
    
    doc.setFontSize(18);
    doc.text('Vision Angels - User Report', 14, 15);
    
    doc.setFontSize(10);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 25);
    
    doc.autoTable({ 
      head: [rows[0]], 
      body: rows.slice(1),
      startY: 35,
      theme: 'grid',
      headStyles: { 
        fillColor: [220, 20, 60],
        textColor: [255, 255, 255],
        fontStyle: 'bold'
      },
      styles: { 
        fontSize: 9,
        cellPadding: 3
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245]
      }
    });
    
    doc.save(`vision-angels-users-${new Date().toISOString().split('T')[0]}.pdf`);
  } catch (error) {
    console.error("Error exporting PDF:", error);
    alert("Error exporting PDF. Please try again.");
  }
});

function openModal(modalId) {
  document.getElementById(modalId).style.display = "block";
  document.body.style.overflow = "hidden";
}

function closeModal(modalId) {
  document.getElementById(modalId).style.display = "none";
  document.body.style.overflow = "auto";
}

window.openEditModal = function(userId, userData) {
  currentEditUserId = userId;
  
  if (typeof userData === 'string') {
    userData = JSON.parse(userData.replace(/&quot;/g, '"'));
  }
  
  document.getElementById("editFirstName").value = userData.firstName || '';
  document.getElementById("editLastName").value = userData.lastName || '';
  document.getElementById("editRole").value = userData.role || 'user';
  document.getElementById("editPhone").value = userData.phone || '';
  document.getElementById("editEmail").value = userData.email || '';
  
  openModal("editModal");
};

window.openDeleteModal = function(userId, userName) {
  currentDeleteUserId = userId;
  document.getElementById("deleteUserName").textContent = userName.trim() || 'this user';
  openModal("deleteModal");
};

window.closeModal = closeModal;

document.getElementById("editForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  
  if (!currentEditUserId) {
    alert("Error: No user selected for editing.");
    return;
  }

  const formData = {
    firstName: document.getElementById("editFirstName").value.trim(),
    lastName: document.getElementById("editLastName").value.trim(),
    role: document.getElementById("editRole").value,
    phone: document.getElementById("editPhone").value.trim(),
    email: document.getElementById("editEmail").value.trim()
  };

  if (!formData.firstName || !formData.lastName || !formData.email) {
    alert("Please fill in all required fields.");
    return;
  }

  // Email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(formData.email)) {
    alert("Please enter a valid email address.");
    return;
  }

  try {
    const submitBtn = document.querySelector("#editForm .modal-btn.confirm");
    submitBtn.textContent = "Saving...";
    submitBtn.disabled = true;

    await updateDoc(doc(db, "users", currentEditUserId), formData);
    
    alert("User updated successfully!");
    closeModal("editModal");
    
    location.reload();
    
  } catch (error) {
    console.error("Error updating user:", error);
    alert("Error updating user. Please try again.");
    
    const submitBtn = document.querySelector("#editForm .modal-btn.confirm");
    submitBtn.textContent = originalText;
    submitBtn.disabled = false;
  }
});

// Delete confirmation
window.confirmDelete = async function() {
  if (!currentDeleteUserId) {
    alert("Error: No user selected for deletion.");
    return;
  }

  try {
    const deleteBtn = document.querySelector("#deleteModal .modal-btn.danger");
    deleteBtn.textContent = "Deleting...";
    deleteBtn.disabled = true;

    // Delete user document
    await deleteDoc(doc(db, "users", currentDeleteUserId));
    
    alert("User deleted successfully!");
    closeModal("deleteModal");
    
    location.reload();
    
  } catch (error) {
    console.error("Error deleting user:", error);
    alert("Error deleting user. Please try again.");
    
    const deleteBtn = document.querySelector("#deleteModal .modal-btn.danger");
    deleteBtn.textContent = originalText;
    deleteBtn.disabled = false;
  }
};

document.addEventListener("DOMContentLoaded", () => {
  // Close modal when clicking outside
  window.addEventListener("click", (event) => {
    if (event.target.classList.contains("modal")) {
      closeModal("editModal");
      closeModal("deleteModal");
    }
  });

  // Close modal with Escape key
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeModal("editModal");
      closeModal("deleteModal");
    }
  });

  document.querySelectorAll('.close').forEach(closeBtn => {
    closeBtn.addEventListener('click', (e) => {
      const modal = e.target.closest('.modal');
      if (modal) {
        closeModal(modal.id);
      }
    });
  });

  document.querySelectorAll('.modal-btn.cancel').forEach(cancelBtn => {
    cancelBtn.addEventListener('click', (e) => {
      const modal = e.target.closest('.modal');
      if (modal) {
        closeModal(modal.id);
      }
    });
  });
});

document.getElementById("editEmail").addEventListener("blur", (e) => {
  const email = e.target.value.trim();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  if (email && !emailRegex.test(email)) {
    e.target.style.borderColor = "#dc143c";
    e.target.style.boxShadow = "0 0 10px rgba(220, 20, 60, 0.3)";
  } else {
    e.target.style.borderColor = "rgba(255, 69, 0, 0.3)";
    e.target.style.boxShadow = "none";
  }
});

document.querySelector('.mobile-toggle').addEventListener('click', function() {
    const navLinks = document.querySelector('.nav-links');
    navLinks.style.display = navLinks.style.display === 'flex' ? 'none' : 'flex';
});