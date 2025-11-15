// * Extract raw UTF-8 text from .txt file.
export default function extractTXT(buffer) {
  try {
    return buffer.toString("utf8");
  } catch (err) {
    console.error("TXT extraction failed:", err);
    return "";
  }
};