export function suggestNextTime(oldTime) {
  const now = new Date();
  const old = new Date(oldTime);
  const diff = now - old;

  if (diff < 60 * 60 * 1000) {
    // If missed by less than 1 hour, reschedule after 30 mins
    return new Date(now.getTime() + 30 * 60 * 1000);
  }

  // Otherwise, push to next day same time
  const next = new Date(old);
  next.setDate(next.getDate() + 1);
  return next;
}

