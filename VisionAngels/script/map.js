mapboxgl.accessToken = 'pk.eyJ1IjoiaGFrYW5jaG5kciIsImEiOiJjbTVubWZ5ZjIwOTJkMnFzaWZyYnJ6Z2plIn0.MGmgQ6xd_3LJwGv3nWPgNA';

    const map = new mapboxgl.Map({
        container: 'map',
        style: 'mapbox://styles/mapbox/dark-v11',
        center: [25.4858, 42.7339], // Center of Bulgaria
        zoom: 6
    });

    const fireData = [
        {
            id: 1,
            coords: [23.3219, 42.6977], // Sofia
            severity: 'high',
            description: 'Large forest fire near Vitosha Mountain',
            time: '2025-05-26T10:00:00Z'
        },
        {
            id: 2,
            coords: [27.4678, 42.5048], // Burgas
            severity: 'medium',
            description: 'Field fire near Burgas',
            time: '2025-05-26T07:30:00Z'
        },
        {
            id: 3,
            coords: [25.6172, 43.1355], // Veliko Tarnovo
            severity: 'low',
            description: 'Controlled burn area',
            time: '2025-05-25T15:45:00Z'
        }
    ];

    let markers = [];

    function createPopupContent(fire) {
        return `
            <div class="popup-header">
                <span class="popup-severity ${fire.severity}">${fire.severity.toUpperCase()}</span>
            </div>
            <div class="popup-details">
                <div class="popup-detail-item">
                    <span class="popup-detail-label">Location:</span> ${fire.coords[1].toFixed(3)}, ${fire.coords[0].toFixed(3)}
                </div>
                <div class="popup-detail-item">
                    <span class="popup-detail-label">Description:</span> ${fire.description}
                </div>
                <div class="popup-detail-item">
                    <span class="popup-detail-label">Reported:</span> ${new Date(fire.time).toLocaleString()}
                </div>
            </div>
        `;
    }

    function getColorBySeverity(severity) {
        switch (severity) {
            case 'high': return '#ef4444';
            case 'medium': return '#fb923c';
            case 'low': return '#4ade80';
            default: return '#ffffff';
        }
    }

    function renderMarkers(filteredFires) {
        // Remove old markers
        markers.forEach(marker => marker.remove());
        markers = [];

        let highCount = 0;

        filteredFires.forEach(fire => {
            if (fire.severity === 'high') highCount++;

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

        // Update stats
        document.getElementById('activeCount').textContent = filteredFires.length;
        document.getElementById('highCount').textContent = highCount;
        document.getElementById('lastUpdate').textContent =  new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});;
    }

    function toggleLayer(type) {
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
                    const reportedTime = new Date(f.time);
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

    // Initialize map with all fires
    map.on('load', () => {
        toggleLayer('all');
    });