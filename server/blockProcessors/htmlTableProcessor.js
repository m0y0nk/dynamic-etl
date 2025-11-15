import { JSDOM } from 'jsdom';

// Finds <table> ... </table> blocks
const HTML_TABLE_REGEX = /<table.*?>.*?<\/table>/gis;

export async function processHtmlTableBlocks(context) {
  const text = context.remainingText;
  let newText = text;

  newText = text.replace(HTML_TABLE_REGEX, (tableMatch) => {
    try {
      const dom = new JSDOM(tableMatch);
      const table = dom.window.document.querySelector('table');
      if (!table) return tableMatch; // Not a real table

      const headers = [];
      table.querySelectorAll('th').forEach(th => {
        headers.push(th.textContent.trim());
      });

      const tableData = [];
      table.querySelectorAll('tbody tr').forEach(tr => {
        const row = {};
        tr.querySelectorAll('td').forEach((td, index) => {
          const key = headers[index] || `column_${index}`;
          row[key] = td.textContent.trim();
        });
        if (Object.keys(row).length > 0) {
          tableData.push(row);
        }
      });

      if (tableData.length > 0) {
        context.allParsedData.push(...tableData);
        context.fragmentsSummary.html_tables++;
        return `\n__HTML_TABLEx_${context.fragmentsSummary.html_tables}__\n`;
      }
      
      return tableMatch; // No data found, leave it

    } catch (e) {
      console.warn('Failed to parse HTML table:', e.message);
      return tableMatch; // Leave it
    }
  });

  context.remainingText = newText;
}