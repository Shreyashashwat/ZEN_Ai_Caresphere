export const getWeekRange = () => {
  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - 7);

  const f = (d) => d.toISOString().split("T")[0];
  return `${f(start)}_to_${f(end)}`;
};
