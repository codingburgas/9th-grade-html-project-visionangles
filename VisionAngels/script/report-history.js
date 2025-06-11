import { auth, db } from '../data/firebase-config.js';
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/11.8.0/firebase-auth.js';
import { doc, collection, getDocs, deleteDoc, updateDoc } from 'https://www.gstatic.com/firebasejs/11.8.0/firebase-firestore.js';

let currentUpdateReportId = null;
let currentDeleteReportId = null;
let allReports = [];
const table = document.getElementById("reportsTable");
const searchInput = document.getElementById("searchInput");
const statusFilter = document.getElementById("statusFilter");
const severityFilter = document.getElementById("severityFilter");
const exportBtn = document.getElementById("exportBtn");

const statusStyles = {
  active: { class: 'status-active', text: 'Active' },
  inactive: { class: 'status-inactive', text: 'Inactive' },
  'false-alarm': { class: 'status-false-alarm', text: 'False Alarm' }
};

const severityStyles = {
  low: { class: 'severity-low', text: 'Low', emoji: '🟢' },
  medium: { class: 'severity-medium', text: 'Medium', emoji: '🟡' },
  high: { class: 'severity-high', text: 'High', emoji: '🔴' }
};

function formatDate(timestamp) {
  if (!timestamp) return 'N/A';
  
  let date;
  if (timestamp.toDate) {
    date = timestamp.toDate();
  } 
  else if (timestamp instanceof Date) {
    date = timestamp;
  } 
  else {
    date = new Date(timestamp);
  }
  
  return date.toLocaleString();
}

function truncateText(text, maxLength = 50) {
  if (!text) return '';
  return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
}

function createTableRow(id, data) {
  const row = document.createElement("tr");
  
  const statusInfo = statusStyles[data.status] || { class: 'status-active', text: data.status || 'Active' };
  const severityInfo = severityStyles[data.severity] || { class: 'severity-low', text: data.severity || 'Low', emoji: '🟢' };
  
  row.innerHTML = `
    <td>${formatDate(data.timestamp)}</td>
    <td>${truncateText(data.location || data.address, 30)}</td>
    <td>${data.phone || 'Anonymous'}</td>
    <td>
      <span class="severity-badge ${severityInfo.class}">
        ${severityInfo.emoji} ${severityInfo.text}
      </span>
    </td>
    <td>
      <span class="status-badge ${statusInfo.class}">
        ${statusInfo.text}
      </span>
    </td>
    <td>${truncateText(data.description, 40)}</td>
    <td>
      <div class="action-buttons">
        <button class="view-btn" onclick="openViewModal('${id}', ${JSON.stringify(data).replace(/"/g, '&quot;')})">👁️ View</button>
        <button class="edit-btn" onclick="openUpdateModal('${id}', '${data.status || 'active'}')">📝 Update</button>
        <button class="delete-btn" onclick="openDeleteModal('${id}')">🗑️ Delete</button>
      </div>
    </td>
  `;
  return row;
}

function loadReports() {
  const tbody = table.querySelector('tbody');
  tbody.innerHTML = '';
  
  allReports.forEach(({ id, data }) => {
    const row = createTableRow(id, data);
    tbody.appendChild(row);
  });
}

function filterReports() {
  const searchQuery = searchInput.value.toLowerCase();
  const statusFilterValue = statusFilter.value;
  const severityFilterValue = severityFilter.value;
  
  const rows = table.querySelectorAll("tbody tr");
  
  rows.forEach((row, index) => {
    const reportData = allReports[index]?.data;
    if (!reportData) return;
    
    const matchesSearch = !searchQuery || 
      row.textContent.toLowerCase().includes(searchQuery);
    
    const matchesStatus = !statusFilterValue || 
      (reportData.status || 'active') === statusFilterValue;
    
    const matchesSeverity = !severityFilterValue || 
      (reportData.severity || 'low') === severityFilterValue;
    
    const shouldShow = matchesSearch && matchesStatus && matchesSeverity;
    row.style.display = shouldShow ? "" : "none";
  });
}

onAuthStateChanged(auth, async () => {
  try {
    const reportsSnapshot = await getDocs(collection(db, "fires"));
    allReports = [];
    
    reportsSnapshot.forEach(docSnap => {
      allReports.push({
        id: docSnap.id,
        data: docSnap.data()
      });
    });

    allReports.sort((a, b) => {
      const dateA = a.data.timestamp?.toDate?.() || new Date(a.data.timestamp) || new Date(0);
      const dateB = b.data.timestamp?.toDate?.() || new Date(b.data.timestamp) || new Date(0);
      return dateB - dateA;
    });

    loadReports();

  } catch (error) {
    console.error("Error loading fire reports:", error);
    alert("Error loading fire report data. Please refresh the page.");
  }
});

searchInput.addEventListener("input", filterReports);
statusFilter.addEventListener("change", filterReports);
severityFilter.addEventListener("change", filterReports);

exportBtn.addEventListener("click", () => {
  try {
    const doc = new window.jspdf.jsPDF();
    const visibleRows = Array.from(table.querySelectorAll("tbody tr"))
      .filter(row => row.style.display !== "none")
      .map(tr => Array.from(tr.children).slice(0, -1).map(td => td.innerText));
    
    const headers = Array.from(table.querySelectorAll("thead th"))
      .slice(0, -1).map(th => th.innerText);
    
    doc.setFontSize(18);
    doc.text('Vision Angels - Fire Reports History', 14, 15);
    
    doc.setFontSize(10);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 25);
    doc.text(`Total Reports: ${visibleRows.length}`, 14, 30);
    
    doc.autoTable({ 
      head: [headers], 
      body: visibleRows,
      startY: 40,
      theme: 'grid',
      headStyles: { 
        fillColor: [220, 20, 60],
        textColor: [255, 255, 255],
        fontStyle: 'bold'
      },
      styles: { 
        fontSize: 8,
        cellPadding: 2
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245]
      },
      columnStyles: {
        0: { cellWidth: 25 }, // Date/Time
        1: { cellWidth: 30 }, // Location
        2: { cellWidth: 25 }, // Reporter
        3: { cellWidth: 20 }, // Severity
        4: { cellWidth: 20 }, // Status
        5: { cellWidth: 40 }  // Description
      }
    });
    
    doc.save(`vision-angels-fire-reports-${new Date().toISOString().split('T')[0]}.pdf`);
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

window.openViewModal = function(reportId, reportData) {
  if (typeof reportData === 'string') {
    reportData = JSON.parse(reportData.replace(/&quot;/g, '"'));
  }
  
  document.getElementById("viewReportId").textContent = reportId;
  document.getElementById("viewDateTime").textContent = formatDate(reportData.timestamp);
  document.getElementById("viewLocation").textContent = reportData.location || reportData.address || 'N/A';
  document.getElementById("viewCoordinates").textContent = 
    reportData.coords[0] && reportData.coords[1] ? 
    `${reportData.coords[0]}, ${reportData.coords[1]}` : 'N/A';
  document.getElementById("viewReporterContact").textContent = 
    reportData.reporterPhone || 'N/A';
  
  const severityInfo = severityStyles[reportData.severity] || severityStyles.low;
  const severityElement = document.getElementById("viewSeverity");
  severityElement.textContent = `${severityInfo.emoji} ${severityInfo.text}`;
  severityElement.className = `severity-badge ${severityInfo.class}`;
  
  const statusInfo = statusStyles[reportData.status] || statusStyles.active;
  const statusElement = document.getElementById("viewStatus");
  statusElement.textContent = statusInfo.text;
  statusElement.className = `status-badge ${statusInfo.class}`;
  
  document.getElementById("viewDescription").textContent = reportData.description || 'No description provided';
  
  const imageGroup = document.getElementById("viewImageGroup");
  const imageElement = document.getElementById("viewImage");
  if (reportData.imageUrl) {
    imageElement.src = reportData.imageUrl;
    imageGroup.style.display = "block";
  } else {
    imageGroup.style.display = "none";
  }
  
  openModal("viewModal");
};

window.openUpdateModal = function(reportId, currentStatus) {
  currentUpdateReportId = reportId;
  document.getElementById("updateStatus").value = currentStatus || 'active';
  openModal("updateModal");
};

window.openDeleteModal = function(reportId) {
  currentDeleteReportId = reportId;
  openModal("deleteModal");
};

window.closeModal = closeModal;

document.getElementById("updateForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  
  if (!currentUpdateReportId) {
    alert("Error: No report selected for update.");
    return;
  }

  const newStatus = document.getElementById("updateStatus").value;

  try {
    const submitBtn = document.querySelector("#updateForm .modal-btn.confirm");
    submitBtn.textContent = "Updating...";
    submitBtn.disabled = true;

    const updateData = {
      status: newStatus,
      lastUpdated: new Date()
    };

    await updateDoc(doc(db, "fires", currentUpdateReportId), updateData);
    
    alert("Report status updated successfully!");
    closeModal("updateModal");
    
    location.reload();
    
  } catch (error) {
    console.error("Error updating report:", error);
    alert("Error updating report. Please try again.");
    
    const submitBtn = document.querySelector("#updateForm .modal-btn.confirm");
    submitBtn.textContent = "Update Status";
    submitBtn.disabled = false;
  }
});

window.confirmDelete = async function() {
  if (!currentDeleteReportId) {
    alert("Error: No report selected for deletion.");
    return;
  }

  try {
    const deleteBtn = document.querySelector("#deleteModal .modal-btn.danger");
    deleteBtn.textContent = "Deleting...";
    deleteBtn.disabled = true;

    await deleteDoc(doc(db, "fires", currentDeleteReportId));
    
    alert("Fire report deleted successfully!");
    closeModal("deleteModal");
    
    location.reload();
    
  } catch (error) {
    console.error("Error deleting report:", error);
    alert("Error deleting report. Please try again.");
    
    const deleteBtn = document.querySelector("#deleteModal .modal-btn.danger");
    deleteBtn.textContent = "Delete Report";
    deleteBtn.disabled = false;
  }
};

document.addEventListener("DOMContentLoaded", () => {

  window.addEventListener("click", (event) => {
    if (event.target.classList.contains("modal")) {
      closeModal("viewModal");
      closeModal("updateModal");
      closeModal("deleteModal");
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeModal("viewModal");
      closeModal("updateModal");
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

document.querySelector('.mobile-toggle').addEventListener('click', function() {
    const navLinks = document.querySelector('.nav-links');
    navLinks.style.display = navLinks.style.display === 'flex' ? 'none' : 'flex';
});