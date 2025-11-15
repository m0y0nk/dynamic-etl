import express from "express";
import multer from "multer";
import Source from "../models/Source.js";
import Schema from "../models/Schema.js";
import Record from "../models/Record.js";
import { parseFile } from "../etl/parser.js";

const router = express.Router();
const upload = multer({ dest: "uploads/" });

router.post("/", upload.single("file"), async (req, res) => {
  const { source_id } = req.body;
  const sourceId = source_id || `src_${Date.now()}`;

  await Source.updateOne(
    { sourceId },
    { $setOnInsert: { sourceId } },
    { upsert: true }
  );

  const buffer = Buffer.from(req.file.buffer || await fs.promises.readFile(req.file.path));
  const mimetype = req.file.mimetype;
  const filename = req.file.originalname;

  // 🔥 Parse real content
  const { summary, detail } = await parseFile(buffer, mimetype, filename);

  // store parsed fragments
  await Record.create({
    sourceId,
    rawFile: filename,
    parsed: detail
  });

  // Keep schema stub (schema generation comes in Stage 3)
  const schemaId = `schema_${Date.now()}`;
  await Schema.create({
    sourceId,
    schemaId,
    generatedAt: new Date(),
    fields: [],
    version: 1,
    compatibleDbs: ["mongodb"],
    summary
  });

  res.json({
    status: "ok",
    source_id: sourceId,
    file_id: req.file.filename,
    schema_id: schemaId,
    parsed_fragments_summary: summary
  });
});

export default router;
