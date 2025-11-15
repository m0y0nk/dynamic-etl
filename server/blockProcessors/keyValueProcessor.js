// This is the regex you provided.
// It finds all lines that match the key: value or key=value format.
// ^ = start of line (due to 'm' flag)
// \s*([\w.-]+)\s* = Capture group 1: the key (word chars, dot, dash)
// [:=] = Separator
// \s*(.+)\s* = Capture group 2: the value (anything until end of line)
// $ = end of line (due to 'm' flag)
// gm = Global (all matches) and Multiline
const KEY_VALUE_REGEX = /^\s*([\w.-]+)\s*[:=]\s*(.+)\s*$/gm;

export async function processKeyValueBlocks(context) {
  const text = context.remainingText;
  
  // We will collect all loose KV pairs into a single object.
  // This processor runs last, so it's "cleaning up" what's left.
  const kvData = {};
  let foundMatches = 0;

  const newText = text.replace(KEY_VALUE_REGEX, (match, key, value) => {
    // Add the found data to our object
    kvData[key.trim()] = value.trim();
    foundMatches++;
    
    // Return a placeholder to "remove" this line from the text
    return `\n__KV_PAIR_${foundMatches}__\n`;
  });

  // If we found any matches, add the collected object to our data array
  if (foundMatches > 0) {
    context.allParsedData.push(kvData);
    context.fragmentsSummary.kv_pairs = foundMatches;
  }

  // Update the remaining text
  context.remainingText = newText;
}