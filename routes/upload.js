import express from "express";
import multer from "multer";
import Source from "../models/Source.js";
import Schema from "../models/Schema.js";

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

  // Create minimal schema stub
  const schemaId = `schema_${Date.now()}`;

  await Schema.create({
    sourceId,
    schemaId,
    generatedAt: new Date(),
    fields: [],
    version: 1,
    compatibleDbs: ["mongodb"],
    summary: {
      stage: "stub",
      fragments: 0
    }
  });

  res.json({
    status: "ok",
    source_id: sourceId,
    file_id: req.file.filename,
    schema_id: schemaId,
    parsed_fragments_summary: {}
  });
});

export default router;
