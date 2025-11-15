import * as cheerio from "cheerio";
import * as yaml from "yaml";
import * as pdfParse from "pdf-parse";


// Utility regex
const KV_REGEX = /^\s*([\w\-\s]+)[:=]\s*(.+)$/;
const CSV_ROW = /^([^,\n]+,){1,}[^,\n]+$/;

export async function parseFile(buffer, mimetype, filename) {
  let text = "";

  // --- PDF TEXT EXTRACTION ---
  if (mimetype === "application/pdf" || filename.endsWith(".pdf")) {
    try {
      const data = await pdfParse(buffer);
      text = data.text;
    } catch (e) {
      text = "";
    }
  } else {
    text = buffer.toString("utf-8");
  }

  // ---------- JSON FRAGMENTS ----------
  const jsonFragments = [];
  const jsonRegex = /\{[\s\S]{10,20000}?\}/g;
  let m;
  while ((m = jsonRegex.exec(text)) !== null) {
    try {
      const obj = JSON.parse(m[0]);
      jsonFragments.push({ json: obj });
    } catch (_) {}
  }

  // ---------- JSON-LD ----------
  const jsonLdFragments = [];
  const $ = cheerio.load(text);
  $('script[type="application/ld+json"]').each((_, el) => {
    try {
      jsonLdFragments.push(JSON.parse($(el).html()));
    } catch (_) {}
  });

  // ---------- YAML FRONTMATTER ----------
  const yamlFragments = [];
  const yamlRegex = /^---\n([\s\S]+?)\n---/m;
  const yamlMatch = yamlRegex.exec(text);
  if (yamlMatch) {
    try {
      yamlFragments.push(yaml.parse(yamlMatch[1]));
    } catch (_) {}
  }

  // ---------- HTML TABLES ----------
  const htmlTables = [];
  $("table").each((_, table) => {
    const headers = [];
    $(table)
      .find("th")
      .each((_, th) => headers.push($(th).text().trim()));

    const rows = [];
    $(table)
      .find("tr")
      .each((_, tr) => {
        const cells = [];
        $(tr)
          .find("td")
          .each((_, td) => cells.push($(td).text().trim()));
        if (cells.length) rows.push(cells);
      });

    if (headers.length || rows.length)
      htmlTables.push({ headers, rows });
  });

  // ---------- CSV BLOCKS ----------
  const csvBlocks = [];
  let lines = text.split("\n");
  for (let i = 0; i < lines.length; i++) {
    if (CSV_ROW.test(lines[i])) {
      const block = [];
      while (i < lines.length && CSV_ROW.test(lines[i])) {
        block.push(lines[i].split(",").map((s) => s.trim()));
        i++;
      }
      if (block.length >= 2) csvBlocks.push(block);
    }
  }

  // ---------- KEY-VALUE PAIRS ----------
  const kvPairs = [];
  lines.forEach((line) => {
    const match = KV_REGEX.exec(line);
    if (match) {
      kvPairs.push({
        key: match[1].trim(),
        value: match[2].trim(),
      });
    }
  });

  return {
    summary: {
      json_fragments: jsonFragments.length,
      json_ld: jsonLdFragments.length,
      yaml_blocks: yamlFragments.length,
      html_tables: htmlTables.length,
      csv_blocks: csvBlocks.length,
      kv_pairs: kvPairs.length,
    },
    detail: {
      jsonFragments,
      jsonLdFragments,
      yamlFragments,
      htmlTables,
      csvBlocks,
      kvPairs,
      rawText: text.slice(0, 2000),
    },
  };
}
