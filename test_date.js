function addDays(dateStr, days) {
  if (!dateStr) return null;
  const parts = String(dateStr).split('T')[0].split('-');
  let d;
  if (parts.length === 3) {
    const [y, m, day] = parts.map(Number);
    d = new Date(y, m - 1, day);
  } else {
    d = new Date(dateStr);
  }
  d.setDate(d.getDate() + days);
  
  const Y = d.getFullYear();
  const M = String(d.getMonth() + 1).padStart(2, '0');
  const D = String(d.getDate()).padStart(2, '0');
  return `${Y}-${M}-${D}`;
}

console.log(addDays("2026-06-11", 30));
