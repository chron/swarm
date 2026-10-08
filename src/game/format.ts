export function fmt(n: number, digits = 2): string {
  if (!isFinite(n)) return '∞';
  const neg = n < 0;
  n = Math.abs(n);
  let out: string;
  if (n < 1000) out = n < 10 && n % 1 !== 0 ? n.toFixed(1) : Math.floor(n).toString();
  else {
    const units = ['K', 'M', 'B', 'T', 'Qa', 'Qi', 'Sx'];
    let i = -1;
    while (n >= 1000 && i < units.length - 1) {
      n /= 1000;
      i++;
    }
    out = `${n.toFixed(n < 10 ? digits : n < 100 ? 1 : 0)}${units[i]}`;
  }
  return neg ? `-${out}` : out;
}

export const money = (n: number) => `$${fmt(n)}`;
export const pct = (n: number) => `${Math.round(n * 100)}%`;

export function duration(sec: number) {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}
