export function suggestNextTime(oldTime) {
  const scheduled = new Date(oldTime);
  const now = new Date();
  const diff = now - scheduled;

  if (diff < 60 * 60 * 1000) {
    // push 30 minutes from scheduled time (not now)
    return new Date(scheduled.getTime() + 30 * 60 * 1000);
  }

  // push to next day same time
  const next = new Date(scheduled);
  next.setDate(next.getDate() + 1);
  return next;
}