// Reverse sort array
function CompareNumbers(a, b) {
  if (parseInt(a.id) < parseInt(b.id))
    return 1;
  if (parseInt(a.id) > parseInt(b.id))
    return -1;
  return 0;
}
exports.CompareNumbers = CompareNumbers;
