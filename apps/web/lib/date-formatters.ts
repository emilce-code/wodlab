export type DateTimeValue = string | number | Date;

export type DateFormatOptions = {
  timeZone?: string;
};

function formatTimestamp(
  value: DateTimeValue,
  locale: string,
  options: Intl.DateTimeFormatOptions,
): string {
  return new Intl.DateTimeFormat(locale, options).format(new Date(value));
}

export function formatDate(
  value: DateTimeValue,
  locale: string,
  options: DateFormatOptions = {},
): string {
  return formatTimestamp(value, locale, {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: options.timeZone,
  });
}

export function formatShortDate(
  value: DateTimeValue,
  locale: string,
  options: DateFormatOptions = {},
): string {
  return formatTimestamp(value, locale, {
    month: "short",
    day: "numeric",
    timeZone: options.timeZone,
  });
}

export function formatTime(
  value: DateTimeValue,
  locale: string,
  options: DateFormatOptions = {},
): string {
  return formatTimestamp(value, locale, {
    hour: "numeric",
    minute: "2-digit",
    timeZone: options.timeZone,
  });
}

export function formatWeekdayDate(
  value: DateTimeValue,
  locale: string,
  includeYear: boolean,
  options: DateFormatOptions = {},
): string {
  return formatTimestamp(value, locale, {
    weekday: "long",
    month: "short",
    day: "numeric",
    year: includeYear ? "numeric" : undefined,
    timeZone: options.timeZone,
  });
}

export function formatCalendarDate(value: string, locale: string): string {
  const [year, month, day] = value.split("-").map(Number);

  return formatTimestamp(Date.UTC(year, month - 1, day), locale, {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

export function formatClockTime(value: string, locale: string): string {
  const [hours, minutes] = value.split(":").map(Number);

  return formatTimestamp(Date.UTC(2000, 0, 1, hours, minutes), locale, {
    hour: "numeric",
    minute: "2-digit",
    timeZone: "UTC",
  });
}
