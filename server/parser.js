import pdf from 'pdf-parse';
import { processJsonBlocks } from './blockProcessors/jsonProcessor.js';
import { processHtmlTableBlocks } from './blockProcessors/htmlTableProcessor.js';
import { processCsvBlocks } from './blockProcessors/csvProcessor.js';
import { processKeyValueBlocks } from './blockProcessors/keyValueProcessor.js';
// We can easily add more processors here, like processYamlBlocks

// The pipeline of processors, in order of precedence.
// We must find "tight" structures (JSON, HTML) before
// "loose" structures (Key-Value).
const processors = [
  processJsonBlocks,
  processHtmlTableBlocks,
//   processCsvBlocks,
//   processKeyValueBlocks,
  // ... add new processors here
];

export async function parseFileContent(content, mimetype) {
  let textContent = content;

  // 1. Pre-processing: Get raw text
  if (mimetype === 'application/pdf') {
    // This handles text-based PDFs. Scanned PDFs (OCR) would
    // require a library like tesseract.js
    const data = await pdf(content);
    textContent = data.text;
  }

  // 2. Initialize the parsing context
  // Each processor will modify this object.
  const context = {
    originalText: textContent,
    remainingText: textContent, // The text left to parse
    allParsedData: [],           // All *structured* objects we find
    fragmentsSummary: {
      json_fragments: 0,
      html_tables: 0,
      csv_sections: 0,
      kv_pairs: 0,
      malformed_fragments: 0,
    },
  };

  // 3. Run the pipeline
  for (const processor of processors) {
    // Each processor finds its blocks, parses them,
    // adds data to `allParsedData`, and "removes"
    // the block from `remainingText` so others don't parse it.
    await processor(context);
  }

  // 4. Handle "leftover" free text (optional)
  // At this point, context.remainingText is just the "noise"
  // We could analyze it for sentiment, entities, etc., or just ignore it.

  // 5. Data Cleaning & Canonicalization
  // We apply this *after* all blocks are parsed.
  const cleanedData = context.allParsedData.map(record => cleanRecord(record));

  return { 
    parsedData: cleanedData, 
    fragmentsSummary: context.fragmentsSummary 
  };
}

function cleanRecord(record) {
  // Example: Normalize prices
  // This is where you'd handle "9.99 USD", "$9.99", "9,99"
  // from the test guide [cite: 172-174]
  if (record.price && typeof record.price === 'string') {
    record.price = parseFloat(record.price.replace('$', '').replace('USD', '').replace(',', '.').trim());
  }

  // Example: Consolidate repeated fields 
  if (record.price_usd && !record.price) {
    record.price = record.price_usd;
    delete record.price_usd;
  }
  
  return record;
}