const list = [
  { dueDate: "2024-05-10" },
  { dueDate: "05/11/2024" }, // Invalid ISO, new Date() might parse as May 11
  { dueDate: "11-05-2024" }, // DD-MM-YYYY or MM-DD-YYYY?
  { dueDate: "" },
  { dueDate: "2025-01-01" },
  { dueDate: "2024-04-12T00:00:00.000Z" }
];

function getSortTime(val) {
  if (!val) return 0;
  const str = String(val);
  const parts = str.split('T')[0].split('-');
  if (parts.length === 3 && parts[0].length === 4) {
    // YYYY-MM-DD
    const [y, m, d] = parts.map(Number);
    return new Date(y, m - 1, d).getTime();
  }
  // Fallback
  const t = new Date(str).getTime();
  return isNaN(t) ? 0 : t;
}

list.sort((a,b) => {
  const tA = getSortTime(a.dueDate);
  const tB = getSortTime(b.dueDate);
  return tA - tB;
});
console.log(list.map(i => ({ date: i.dueDate, time: getSortTime(i.dueDate) })));
