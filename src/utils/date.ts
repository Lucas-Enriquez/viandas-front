export function todayYmd(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function ymdToDate(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) {
    return new Date();
  }
  return new Date(year, month - 1, day);
}

export function timeToDate(value: string) {
  const [hours = 0, minutes = 0, seconds = 0] = value.split(":").map(Number);
  const date = new Date();
  date.setHours(hours, minutes, seconds, 0);
  return date;
}

export function dateToBackendTime(value: Date) {
  const hours = String(value.getHours()).padStart(2, "0");
  const minutes = String(value.getMinutes()).padStart(2, "0");
  const seconds = String(value.getSeconds()).padStart(2, "0");
  return `${hours}:${minutes}:${seconds}`;
}

export function formatTimeLabel(value: string) {
  const date = timeToDate(value);
  return date.toLocaleTimeString("es-AR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatMenuDate(value: string) {
  const date = ymdToDate(value);
  const formatted = date.toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "long",
    weekday: "long",
  });
  return formatted.replace(
    /(^|de )([a-záéíóúñ])/g,
    (_, prefix, letter) => prefix + letter.toUpperCase(),
  );
}

export function formatRelativeDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString("es-AR", {
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    month: "2-digit",
  });
}
