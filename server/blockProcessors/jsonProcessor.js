import { jsonRepair } from 'json-repair'; // We'll install this: npm install json-repair

// This regex finds things that *look* like JSON objects or arrays.
// It's non-greedy (.*?) and matches across lines (s flag).
const JSON_BLOCK_REGEX = /({.*?}|\[.*?\])/gs;

export async function processJsonBlocks(context) {
  const text = context.remainingText;
  let newText = text;

  // We use .replace() to find *and* remove blocks in one pass
  newText = text.replace(JSON_BLOCK_REGEX, (blockMatch) => {
    try {
      // 1. First, try to parse it normally
      const parsedData = JSON.parse(blockMatch);
      
      // Success!
      context.fragmentsSummary.json_fragments++;
      // Add data (flatten if it's an array)
      if (Array.isArray(parsedData)) {
        context.allParsedData.push(...parsedData);
      } else {
        context.allParsedData.push(parsedData);
      }
      
      // Return a "placeholder" to remove this block from the text
      return `\n__JSON_BLOCK_${context.fragmentsSummary.json_fragments}__\n`;

    } catch (e1) {
      // 2. "Handling Mismanagement": The parse failed. Try to repair it.
      // This handles the "MALFORMED JSON FRAGMENT" from the guide 
      try {
        const repairedJson = jsonRepair(blockMatch);
        const parsedData = JSON.parse(repairedJson);

        // Repair was successful!
        console.log('Repaired malformed JSON block.');
        context.fragmentsSummary.json_fragments++;
        context.fragmentsSummary.malformed_fragments++;
        
        if (Array.isArray(parsedData)) {
          context.allParsedData.push(...parsedData);
        } else {
          context.allParsedData.push(parsedData);
        }
        
        return `\n__JSON_BLOCK_${context.fragmentsSummary.json_fragments}__\n`;
      
      } catch (e2) {
        // 3. Repair failed. This isn't JSON.
        // We log it and, most importantly, *do not* return a placeholder.
        // This leaves the text for other parsers (like KV) to try.
        console.warn('Could not parse or repair JSON-like block:', blockMatch, e2.message);
        return blockMatch; // Leave it for the next processor
      }
    }
  });

  context.remainingText = newText;
}