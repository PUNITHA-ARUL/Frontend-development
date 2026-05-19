const counterEl = document.getElementById("counter");
const statusEl = document.getElementById("status-text");
const STORAGE_KEY = "peopleCounterSaved";
let count = 0;

function updateCounter() {
    counterEl.innerText = count;
}

function btn() {
    count += 1;
    updateCounter();
    statusEl.textContent = `Current count: ${count}`;
}

function save() {
    localStorage.setItem(STORAGE_KEY, count);
    statusEl.innerHTML = `Saved <strong>${count}</strong> person${count === 1 ? "" : "s"}!`;
}

window.addEventListener("DOMContentLoaded", () => {
    const saved = localStorage.getItem(STORAGE_KEY);

    if (saved !== null) {
        statusEl.textContent = `Last saved count: ${saved}`;
    }
});



