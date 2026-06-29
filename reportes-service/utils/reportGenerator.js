const fs = require('fs');
const path = require('path');

class ReportGenerator {
  constructor() {
    this.reportDir = path.join(__dirname, '../reports');
    if (!fs.existsSync(this.reportDir)) {
      fs.mkdirSync(this.reportDir, { recursive: true });
    }
  }

  generateCSV(data, headers, filename) {
    try {
      let csv = headers.join(',') + '\n';
      
      data.forEach(row => {
        const values = headers.map(header => {
          const value = row[header] || '';
          return `"${String(value).replace(/"/g, '""')}"`;
        });
        csv += values.join(',') + '\n';
      });

      const filepath = path.join(this.reportDir, `${filename}.csv`);
      fs.writeFileSync(filepath, csv, 'utf8');
      
      return {
        success: true,
        filepath,
        filename: `${filename}.csv`,
        size: fs.statSync(filepath).size
      };
    } catch (error) {
      console.error('Error generando CSV:', error);
      return { success: false, error: error.message };
    }
  }

  generateJSON(data, filename) {
    try {
      const filepath = path.join(this.reportDir, `${filename}.json`);
      fs.writeFileSync(filepath, JSON.stringify(data, null, 2), 'utf8');
      
      return {
        success: true,
        filepath,
        filename: `${filename}.json`,
        size: fs.statSync(filepath).size
      };
    } catch (error) {
      console.error('Error generando JSON:', error);
      return { success: false, error: error.message };
    }
  }

  generateSimpleHTML(data, title, headers) {
    try {
      let html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <title>${title}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            h1 { color: #333; }
            table { border-collapse: collapse; width: 100%; margin-top: 20px; }
            th { background-color: #4CAF50; color: white; padding: 12px; text-align: left; }
            td { padding: 10px; border-bottom: 1px solid #ddd; }
            tr:hover { background-color: #f5f5f5; }
            .header { background-color: #f8f9fa; padding: 10px; border-radius: 5px; margin-bottom: 20px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>${title}</h1>
            <p>Generado: ${new Date().toLocaleString()}</p>
          </div>
          <table>
            <thead>
              <tr>`;

      headers.forEach(header => {
        html += `<th>${header}</th>`;
      });

      html += `</tr></thead><tbody>`;

      data.forEach(row => {
        html += `<tr>`;
        headers.forEach(header => {
          html += `<td>${row[header] || '-'}</td>`;
        });
        html += `</tr>`;
      });

      html += `</tbody></table></body></html>`;

      const filename = `${title.toLowerCase().replace(/ /g, '_')}_${Date.now()}`;
      const filepath = path.join(this.reportDir, `${filename}.html`);
      fs.writeFileSync(filepath, html, 'utf8');
      
      return {
        success: true,
        filepath,
        filename: `${filename}.html`,
        size: fs.statSync(filepath).size
      };
    } catch (error) {
      console.error('Error generando HTML:', error);
      return { success: false, error: error.message };
    }
  }
}

module.exports = ReportGenerator;