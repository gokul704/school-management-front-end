/**
 * Export data to CSV format
 */
export function exportToCSV<T extends Record<string, any>>(
  data: T[],
  filename: string,
  headers: { key: keyof T | string; label: string }[]
) {
  if (data.length === 0) {
    alert('No data to export');
    return;
  }

  // Create CSV header row
  const csvHeaders = headers.map(h => h.label).join(',');
  
  // Create CSV data rows
  const csvRows = data.map(row => {
    return headers.map(header => {
      const value = row[header.key as string];
      // Handle null/undefined values
      if (value === null || value === undefined) return '';
      // Escape commas and quotes in values
      const stringValue = String(value).replace(/"/g, '""');
      // Wrap in quotes if contains comma, quote, or newline
      if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
        return `"${stringValue}"`;
      }
      return stringValue;
    }).join(',');
  });

  // Combine headers and rows
  const csvContent = [csvHeaders, ...csvRows].join('\n');

  // Create blob and download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
}

/**
 * Export data to Excel format (using CSV with .xlsx extension for simplicity)
 * For full Excel support, you would need a library like xlsx
 */
export function exportToExcel<T extends Record<string, any>>(
  data: T[],
  filename: string,
  headers: { key: keyof T | string; label: string }[]
) {
  // For now, we'll use CSV format
  // In production, you might want to use a library like 'xlsx' for proper Excel export
  exportToCSV(data, filename, headers);
}

