import { db } from "../data/firebase-config.js";
import { collection, onSnapshot, getDocs, doc, getDoc, updateDoc } from "https://www.gstatic.com/firebasejs/11.8.0/firebase-firestore.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.8.0/firebase-auth.js";

mapboxgl.accessToken = 'pk.eyJ1IjoiaGFrYW5jaG5kciIsImEiOiJjbTVubWZ5ZjIwOTJkMnFzaWZyYnJ6Z2plIn0.MGmgQ6xd_3LJwGv3nWPgNA';

const map = new mapboxgl.Map({
  container: 'map',
  style: 'mapbox://styles/mapbox/dark-v11',
  center: [25.4858, 42.7339], // Bulgaria
  zoom: 6
});

let markers = [];
let fireData = [];
let currentUserInfo = null;

const auth = getAuth();

onAuthStateChanged(auth, async (user) => {
  if (user) {
    try {
      const userDocRef = doc(db, "users", user.uid);
      const userDocSnap = await getDoc(userDocRef);
      if (userDocSnap.exists()) {
        currentUserInfo = { uid: user.uid, ...userDocSnap.data() };
        startFireListener();
      } else {
        alert("User data not found in Firestore.");
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
    }
  } else {
    currentUserInfo = null;
  }
});

function createPopupContent(fire) {
  const isFirefighter = currentUserInfo?.role === "firefighter";

  return `
    <div class="popup-content">
      <h3 class="popup-title">Fire Report</h3>
      <p><strong>Severity:</strong> ${fire.severity}</p>
      <p><strong>Address:</strong> ${fire.address}</p>
      <p><strong>Description:</strong> ${fire.description}</p>
      <p><strong>Reported:</strong> ${fire.timestamp?.toDate().toLocaleString() ?? 'Unknown'}</p>
      ${isFirefighter ? `
        <button class="get-route-btn btn-primary" data-id="${fire.id}" style="border-radius: 10px; padding: 10px; self-align: center; margin-top:10px; cursor:pointer;">Get Route</button>
        <button class="deactivate-btn btn-secondary" data-id="${fire.id}" style="border-radius: 10px; padding: 10px; margin-top:10px; cursor:pointer;">Mark as Inactive</button>
        ` : ''}
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
  fires = fires.filter(fire => fire.status == 'active')

  markers.forEach(marker => marker.remove());
  markers = [];

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

  document.getElementById('activeCount').textContent = fires.length;
  document.getElementById('highCount').textContent = fires.filter(f => f.severity === 'high').length;
  document.getElementById('lastUpdate').textContent = new Date().toTimeString().slice(0, 9);
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
        const reportedTime = new Date(f.timestamp?.toDate() ?? f.time);
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

async function showRouteToFire(fireCoords) {
  if (!navigator.geolocation) {
    alert("Geolocation is not supported by your browser.");
    return;
  }

  navigator.geolocation.getCurrentPosition(async position => {
    const userCoords = [position.coords.longitude, position.coords.latitude];

    const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${userCoords[0]},${userCoords[1]};${fireCoords[0]},${fireCoords[1]}?geometries=geojson&access_token=${mapboxgl.accessToken}`;

    try {
      const response = await fetch(url);
      const data = await response.json();

      if (!data.routes || data.routes.length === 0) {
        alert("No route found.");
        return;
      }

      const route = data.routes[0].geometry;

      if (map.getSource('route')) {
        map.removeLayer('route');
        map.removeSource('route');
      }

      map.addSource('route', {
        type: 'geojson',
        data: {
          type: 'Feature',
          geometry: route
        }
      });

      map.addLayer({
        id: 'route',
        type: 'line',
        source: 'route',
        layout: {
          'line-join': 'round',
          'line-cap': 'round'
        },
        paint: {
          'line-color': '#1db7dd',
          'line-width': 5,
          'line-opacity': 0.75
        }
      });

      const coordinates = route.coordinates;
      const bounds = coordinates.reduce((bounds, coord) => bounds.extend(coord), new mapboxgl.LngLatBounds(coordinates[0], coordinates[0]));
      map.fitBounds(bounds, { padding: 50 });

    } catch (error) {
      console.error("Error fetching directions:", error);
      alert("Failed to load route.");
    }
  }, () => {
    alert("Unable to retrieve your location.");
  });
}

document.body.addEventListener('click', async (event) => {
  if (event.target.classList.contains('get-route-btn')) {
    event.target.disabled = true;

    if (!currentUserInfo) {
      alert("User is not logged in.");
      event.target.disabled = false;
      return;
    }

    const fireId = event.target.getAttribute('data-id');
    const fire = fireData.find(f => f.id === fireId);
    if (!fire) {
      alert("Fire not found.");
      event.target.disabled = false;
      return;
    }

    showRouteToFire(fire.coords);
  }

  if (event.target.classList.contains('deactivate-btn')) {
    const fireId = event.target.getAttribute('data-id');
    const confirmDeactivation = confirm("Are you sure you want to mark this fire as inactive?");
    if (!confirmDeactivation) return;

    try {
      const fireRef = doc(db, "fires", fireId);
      await updateDoc(fireRef, {
        status: 'inactive'
      });

      alert("Fire marked as inactive.");
      renderMarkers(fireData);
    } catch (error) {
      console.error("Failed to deactivate fire:", error);
      alert("Failed to mark fire as inactive.");
    }
  }
});


const pulsingDot = document.createElement('div');

pulsingDot.style.width = '20px';
pulsingDot.style.height = '20px';
pulsingDot.style.borderRadius = '50%';
pulsingDot.style.backgroundColor = 'rgba(56, 135, 190, 1)';
pulsingDot.style.border = '3px solid white';
pulsingDot.style.position = 'relative';
pulsingDot.style.cursor = 'pointer';
pulsingDot.style.boxShadow = '0 0 0 0 rgba(0, 122, 255, 0.7)';
pulsingDot.style.animation = 'pulse 2s infinite';

const style = document.createElement('style');
style.textContent = `
  @keyframes pulse {
    0% {
      box-shadow: 0 0 0 0 rgba(0, 122, 255, 0.7);
    }
    70% {
      box-shadow: 0 0 0 10px rgba(0, 122, 255, 0);
    }
    100% {
      box-shadow: 0 0 0 0 rgba(0, 122, 255, 0);
    }
  }
`;
document.head.appendChild(style);

let userMarker = null;

function showUserLocation() {
  if (!navigator.geolocation) {
    alert("Geolocation is not supported by your browser.");
    return;
  }

  navigator.geolocation.getCurrentPosition(position => {
    const userCoords = [position.coords.longitude, position.coords.latitude];

    if (!userMarker) {
      userMarker = new mapboxgl.Marker(pulsingDot)
        .setLngLat(userCoords)
        .addTo(map);

      userMarker.getElement().addEventListener('click', () => {
        new mapboxgl.Popup({ offset: 25 })
          .setLngLat(userCoords)
          .setHTML('<div style="font-weight:bold;">You</div>')
          .addTo(map);
      });

    } else {
      userMarker.setLngLat(userCoords);
    }
  }, () => {
    alert("Unable to retrieve your location.");
  });
}

function startFireListener() {
  const firesCollection = collection(db, "fires");
  onSnapshot(firesCollection, snapshot => {
    fireData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    renderMarkers(fireData);
  });

  setupControls();
  showUserLocation();

  // Update user location every 30 seconds
  setInterval(showUserLocation, 30000);
}
