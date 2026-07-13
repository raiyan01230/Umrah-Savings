export function getDayName(dateString: string, locale: 'en' | 'bn' = 'en'): string {
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "";
  
  const options: Intl.DateTimeFormatOptions = { weekday: 'long' };
  const enDay = date.toLocaleDateString('en-US', options);
  
  if (locale === 'bn') {
    const daysMap: Record<string, string> = {
      'Sunday': 'রবিবার',
      'Monday': 'সোমবার',
      'Tuesday': 'মঙ্গলবার',
      'Wednesday': 'বুধবার',
      'Thursday': 'বৃহস্পতিবার',
      'Friday': 'শুক্রবার',
      'Saturday': 'শনিবার'
    };
    return daysMap[enDay] || enDay;
  }
  return enDay;
}

export function formatCurrency(amount: number, currency: string = "BDT", locale: 'en' | 'bn' = 'en'): string {
  if (locale === 'bn') {
    // Translate numbers to Bengali digits
    const bnDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
    const formatted = amount.toLocaleString('bn-BD', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    });
    return formatted;
  }
  
  return amount.toLocaleString('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  });
}

export function formatNumber(num: number, locale: 'en' | 'bn' = 'en'): string {
  if (locale === 'bn') {
    const bnDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
    return num.toString().split('').map(char => {
      const parsed = parseInt(char);
      return isNaN(parsed) ? char : bnDigits[parsed];
    }).join('');
  }
  return num.toString();
}

export function downloadCSV(filename: string, rows: any[][]) {
  const csvContent = "data:text/csv;charset=utf-8," 
    + rows.map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(",")).join("\n");
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function printDocument(title: string, tableHeaders: string[], tableRows: string[][]) {
  const printWindow = window.open("", "_blank");
  if (!printWindow) return;
  
  const html = `
    <html>
      <head>
        <title>${title}</title>
        <style>
          body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 20px; color: #333; }
          h1 { text-align: center; color: #166534; font-size: 24px; margin-bottom: 5px; }
          .subtitle { text-align: center; color: #666; font-size: 14px; margin-bottom: 25px; }
          table { width: 100%; border-collapse: collapse; margin-top: 15px; }
          th, td { border: 1px solid #ddd; padding: 10px; text-align: left; font-size: 12px; }
          th { background-color: #166534; color: white; }
          tr:nth-child(even) { background-color: #f9f9f9; }
          .footer { margin-top: 30px; text-align: center; font-size: 10px; color: #999; }
        </style>
      </head>
      <body>
        <h1>${title}</h1>
        <div class="subtitle">Exported from Umrah Savings Tracker</div>
        <table>
          <thead>
            <tr>
              ${tableHeaders.map(header => `<th>${header}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
            ${tableRows.map(row => `
              <tr>
                ${row.map(cell => `<td>${cell}</td>`).join('')}
              </tr>
            `).join('')}
          </tbody>
        </table>
        <div class="footer">Generated on ${new Date().toLocaleDateString()} | Alhamdulillah for everything</div>
        <script>
          window.onload = function() { window.print(); window.close(); }
        </script>
      </body>
    </html>
  `;
  
  printWindow.document.write(html);
  printWindow.document.close();
}
