function updateDateTime() {
  const now = new Date();

  const dateOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  };

  const timeOptions = {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  };

  document.getElementById('auto-date').innerText =
    'Last updated: ' + now.toLocaleDateString('en-US', dateOptions);

  document.getElementById('auto-time').innerText =
    'Time: ' + now.toLocaleTimeString('en-US', timeOptions);
}

// first run
updateDateTime();

// update every 1 minute
setInterval(updateDateTime, 60000);