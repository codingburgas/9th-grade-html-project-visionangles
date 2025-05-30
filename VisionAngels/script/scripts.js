document.addEventListener('DOMContentLoaded', () => {
  const pastelGreen = 'rgba(100, 176, 100, 0.7)';
  const pastelYellow = 'rgba(249, 223, 140, 0.7)';
  const pastelRed = 'rgba(240, 128, 128, 0.7)';
  const pastelOrange = 'rgba(255, 179, 71, 0.7)';

  new Chart(document.getElementById('firesLocation').getContext('2d'), {
    type: 'pie',
    data: {
      labels: ['Kitchen', 'Living room', 'Bedroom', 'Others'],
      datasets: [{
        data: [70, 10, 8, 12],
        backgroundColor: [pastelRed, pastelOrange, pastelYellow, pastelGreen],
        borderColor: 'white',
        borderWidth: 1,
      }]
    },
    options: {
      responsive: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            color: '#fff',
            font: { size: 16 }
          }
        },
        tooltip: {
          enabled: true,
          callbacks: {
            label: ctx => `${ctx.label}: ${ctx.parsed}%`
          }
        }
      }
    }
  });

  new Chart(document.getElementById('fireCauses').getContext('2d'), {
    type: 'bar',
    data: {
      labels: ['Electrical appl.', 'Candles', 'Electric problems', 'Other'],
      datasets: [{
        label: 'Percents',
        data: [45, 20, 25, 10],
        backgroundColor: [pastelGreen, pastelYellow, pastelOrange, pastelRed],
        borderRadius: 1,
      }]
    },
    options: {
      responsive: false,
      maintainAspectRatio: false,
      layout: {
        padding: 30
      },
      scales: {
        x: {
          ticks: {
            maxRotation: 0,
            minRotation: 0,
            color: '#fff'
          }
        },
        y: {
          beginAtZero: true,
          max: 60,
          ticks: {
            stepSize: 20,
            color: '#fff'
          }
        }
      },
      plugins: {
        legend: { display: false }
      }
    }
  });
});
