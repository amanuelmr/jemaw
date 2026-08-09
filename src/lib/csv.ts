export function escapeCsvCell(value: string | number | Date | null | undefined) {
  if (value === null || value === undefined) return "";

  const raw = value instanceof Date ? value.toISOString() : String(value);
  const spreadsheetSafe = /^[=+@]/.test(raw.trimStart()) || /^-\D/.test(raw.trimStart())
    ? `'${raw}`
    : raw;

  return `"${spreadsheetSafe.replaceAll('"', '""')}"`;
}

export function createCsv(
  headers: string[],
  rows: Array<Array<string | number | Date | null | undefined>>
) {
  return [headers, ...rows]
    .map((row) => row.map(escapeCsvCell).join(","))
    .join("\r\n");
}
