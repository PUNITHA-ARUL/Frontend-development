function Deleteitem(event) {
  var button = event.target;
  var row = button.closest('tr');
  if (row) {
    row.remove();
  }
}
