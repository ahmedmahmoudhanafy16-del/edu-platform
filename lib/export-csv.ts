interface CsvRow {
  [key: string]: string | number | null | undefined;
}

export function exportToCsv(filename: string, rows: CsvRow[], headers: Record<string, string>) {
  const keys = Object.keys(headers);
  const headerRow = keys.map(k => `"${headers[k]}"`).join(',');
  const dataRows = rows.map(row =>
    keys.map(k => {
      const val = row[k] ?? '';
      return `"${String(val).replace(/"/g, '""')}"`;
    }).join(',')
  );

  const csv = '\uFEFF' + [headerRow, ...dataRows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
