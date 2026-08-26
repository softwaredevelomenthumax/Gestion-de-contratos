export const parseDateString = (value) => {
  if (!value) return null;

  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value;
  }

  const [year, month, day] = String(value).split("-").map(Number);

  if (!year || !month || !day) {
    return null;
  }

  return new Date(year, month - 1, day);
};

export const calculateContractDurationDays = (startDate, endDate) => {
  const start = parseDateString(startDate);
  const end = parseDateString(endDate);

  if (!start || !end) {
    return 0;
  }

  if (end <= start) {
    return 0;
  }

  const diffInMs = end.getTime() - start.getTime();
  return Math.round(diffInMs / (1000 * 60 * 60 * 24));
};
