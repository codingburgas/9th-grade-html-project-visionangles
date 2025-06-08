import { db } from "../data/firebase-config.js";
import { collection, onSnapshot } from "https://www.gstatic.com/firebasejs/11.8.0/firebase-firestore.js";
import { getDocs } from "https://www.gstatic.com/firebasejs/11.8.0/firebase-firestore.js";


mapboxgl.accessToken = 'pk.eyJ1IjoiaGFrYW5jaG5kciIsImEiOiJjbTVubWZ5ZjIwOTJkMnFzaWZyYnJ6Z2plIn0.MGmgQ6xd_3LJwGv3nWPgNA'; // Replace with your actual token

const map = new mapboxgl.Map({
  container: 'map',
  style: 'mapbox://styles/mapbox/dark-v11',
  center: [25.4858, 42.7339], // Default center (Bulgaria)
  zoom: 6
});

let markers = [];
let fireData = [];

function createPopupContent(fire) {
  return `
    <div class="popup-content">
      <h3>Fire Report</h3>
      <p><strong>Severity:</strong> ${fire.severity}</p>
      <p><strong>Address:</strong> ${fire.address}</p>
      <p><strong>Description:</strong> ${fire.description}</p>
      <p><strong>Reported:</strong> ${fire.timestamp?.toDate().toLocaleString() ?? 'Unknown'}</p>
    </div>
  `;
}

function getColorBySeverity(severity) {
  switch (severity) {
    case 'low': return 'green';
    case 'medium': return 'orange';
    case 'high': return 'red';
    default: return 'gray';
  }
}

function renderMarkers(fires) {
  // Remove old markers
  markers.forEach(marker => marker.remove());
  markers = [];

  // Add new markers
  fires.forEach(fire => {
    const el = document.createElement('div');
    el.className = 'marker';
    el.style.backgroundColor = getColorBySeverity(fire.severity);
    el.style.width = '16px';
    el.style.height = '16px';
    el.style.borderRadius = '50%';
    el.style.border = '2px solid white';

    const marker = new mapboxgl.Marker(el)
      .setLngLat(fire.coords)
      .setPopup(new mapboxgl.Popup().setHTML(createPopupContent(fire)))
      .addTo(map);

    markers.push(marker);
  });

  // Update dashboard stats
  document.getElementById('activeCount').textContent = fires.length;
  document.getElementById('highCount').textContent = fires.filter(f => f.severity === 'high').length;
  document.getElementById('lastUpdate').textContent = new Date().toLocaleTimeString();
}

async function fetchLatestFires() {
  const firesCollection = collection(db, "fires");
  const snapshot = await getDocs(firesCollection);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

async function toggleLayer(type) {
  fireData = await fetchLatestFires();

  const buttons = document.querySelectorAll('.control-btn');
  buttons.forEach(btn => btn.classList.remove('active'));

  switch (type) {
    case 'all':
      renderMarkers(fireData);
      buttons[0].classList.add('active');
      break;
    case 'high':
      renderMarkers(fireData.filter(f => f.severity === 'high'));
      buttons[1].classList.add('active');
      break;
    case 'recent':
      const now = new Date();
      const recentFires = fireData.filter(f => {
        const reportedTime = new Date(f.timestamp?.toDate() ?? f.time); // Adjusted for timestamp type
        const diffHours = (now - reportedTime) / (1000 * 60 * 60);
        return diffHours <= 24;
      });
      renderMarkers(recentFires);
      buttons[2].classList.add('active');
      break;
  }
}

function refreshData() {
  toggleLayer('all');
  const refreshBtn = document.querySelector('.control-btn:last-child');
  refreshBtn.classList.add('active');
  setTimeout(() => refreshBtn.classList.remove('active'), 500);
}

function setupControls() {
  document.querySelector('.all-btn').addEventListener('click', () => toggleLayer('all'));
  document.querySelector('.high-btn').addEventListener('click', () => toggleLayer('high'));
  document.querySelector('.recent-btn').addEventListener('click', () => toggleLayer('recent'));
  document.querySelector('.refresh-btn').addEventListener('click', () => refreshData());
}

map.on('load', () => {
  // Listen for real-time updates initially and store data
  const firesCollection = collection(db, "fires");
  onSnapshot(firesCollection, snapshot => {
    fireData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    renderMarkers(fireData);
  });
  
  setupControls();
});
