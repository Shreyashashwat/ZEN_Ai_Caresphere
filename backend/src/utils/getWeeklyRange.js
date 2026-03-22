export const getWeekRange = () => {
  const now = new Date();

  // Day of week: 0=Sun … 6=Sat  →  shift so Monday=0 … Sunday=6
  const dayOfWeek = now.getDay(); // 0-6
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // days to go back to Monday

  const monday = new Date(now);
  monday.setDate(now.getDate() + mondayOffset);
  monday.setHours(0, 0, 0, 0);

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);

  const f = (d) => d.toISOString().split("T")[0];
  return `${f(monday)}_to_${f(sunday)}`;
};

export const getCurrentWeekBounds = () => {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;

  const start = new Date(now);
  start.setDate(now.getDate() + mondayOffset);
  start.setHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);

  return { start, end };
};