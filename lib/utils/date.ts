/**
 * Returns the current date and time in Indochina Time (GMT+7)
 * formatted as an ISO string without the 'Z' suffix.
 */
export function getVietnamTimeISO() {
  const now = new Date();
  // Indochina Time is UTC+7
  const vnTime = new Date(now.getTime() + 7 * 60 * 60 * 1000);
  return vnTime.toISOString().replace("Z", "");
}

/**
 * Converts a date to Vietnam Time ISO string
 */
export function toVietnamTimeISO(date: Date | string) {
  const d = typeof date === "string" ? new Date(date) : date;
  const vnTime = new Date(d.getTime() + 7 * 60 * 60 * 1000);
  return vnTime.toISOString().replace("Z", "");
}

/**
 * Formats a SQL timestamp string to dd/mm/yyyy HH:mm
 */
export function formatDisplayDateTime(sqlTimestamp: string) {
  if (!sqlTimestamp) return "";
  const formatted = sqlTimestamp.replace(" ", "T");
  const parts = formatted.split("T");
  const [year, month, day] = parts[0].split("-");
  const timePart = parts[1]?.slice(0, 5) ?? "00:00";
  return `${day}/${month}/${year} ${timePart}`;
}
