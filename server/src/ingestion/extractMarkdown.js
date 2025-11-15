//   Extract text from Markdown file.
//   We simply decode the buffer — parsing happens later in the pipeline.
//  
export default function extractMarkdown(buffer) {
  try {
    return buffer.toString("utf8");
  } catch (err) {
    console.error("Markdown extraction failed:", err);
    return "";
  }
}; 