function save() {
  const name = document.getElementById("name").value.trim();
  const age = document.getElementById("age").value.trim();
  const gender = document.querySelector('input[name="gender"]:checked')?.value || "";
  const course = document.getElementById("course").value.trim();
  const email = document.getElementById("email").value.trim();
  const table = document.getElementById("table");
  const tbody = table.querySelector("tbody");

  if (!name || !age || !gender || !course || !email) {
    return;
  }

  const row = tbody.insertRow();
  row.innerHTML = `
    <td>${name}</td>
    <td>${age}</td>
    <td>${gender}</td>
    <td>${course}</td>
    <td>${email}</td>
    <td><button type="button" onclick="deleteRow(this)">Delete</button></td>
  `;
}

function deleteRow(btn) {
  const row = btn.closest("tr");
  if (row) {
    row.remove();
  }
}
