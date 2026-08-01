// common.js
document.addEventListener("DOMContentLoaded", function() {
  const yearEl = document.getElementById("currentYear");
  if (yearEl) {
    yearEl.textContent = new Date().getFullYear();
  }
});