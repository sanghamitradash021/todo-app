/** Returns midnight (00:00:00.000) of the current local day as a Date. */
export function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}
