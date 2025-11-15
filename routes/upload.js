import express from "express";
import multer from "multer";
import fs from "fs";
import Source from "../models/Source.js";
import Schema from "../models/Schema.js";
import Record from "../models/Record.js";
import { parseFile } from "../etl/parser.js";
import { inferSchemaFromParsed, diffSchemas } from "../etl/schemaGen.js";

const router = express.Router();

// IMPORTANT: memoryStorage required for Stage 3+
const upload = multer({
  storage: multer.memoryStorage()
});

router.post("/", upload.single("file"), async (req, res) => {
  const { source_id } = req.body;
  const sourceId = source_id || `src_${Date.now()}`;

  await Source.updateOne(
    { sourceId },
    { $setOnInsert: { sourceId } },
    { upsert: true }
  );

  // buffer exists because of memoryStorage
  const buffer = req.file.buffer;
  const mimetype = req.file.mimetype;
  const filename = req.file.originalname || req.file.filename;

  // 🔥 Parse unstructured file
  const { summary, detail } = await parseFile(buffer, mimetype, filename);

  // Save parsed record
  await Record.create({
    sourceId,
    rawFile: filename,
    parsed: detail
  });

  // 🔥 Generate schema from parsed detail
  const inferred = inferSchemaFromParsed(detail);

  // Get latest schema
  const latest = await Schema.findOne({ sourceId }).sort({ version: -1 }).lean();

  if (!latest) {
    // FIRST SCHEMA
    const schemaId = `schema_${Date.now()}`;

    await Schema.create({
      sourceId,
      schemaId,
      version: 1,
      generatedAt: new Date(),
      fields: inferred.fields,
      compatibleDbs: inferred.compatibleDbs,
      primaryKeyCandidates: inferred.primaryKeyCandidates,
      migrationNotes: "Initial schema generation",
      rawSummary: summary
    });

    return res.status(201).json({
      status: "ok",
      source_id: sourceId,
      file_id: filename,
      schema_id: schemaId,
      parsed_fragments_summary: summary
    });
  }

  // 🔥 DIFF old vs new
  const { delta, notes } = diffSchemas(latest, inferred);

  if (!delta) {
    // No change → do not bump version
    return res.status(200).json({
      status: "ok",
      source_id: sourceId,
      file_id: filename,
      schema_id: latest.schemaId,
      parsed_fragments_summary: summary,
      note: "No schema changes"
    });
  }

  // 🔥 CREATE NEW VERSION
  const newVersion = latest.version + 1;
  const newSchemaId = `schema_${Date.now()}`;

  await Schema.create({
    sourceId,
    schemaId: newSchemaId,
    version: newVersion,
    generatedAt: new Date(),
    fields: inferred.fields,
    compatibleDbs: inferred.compatibleDbs,
    primaryKeyCandidates: inferred.primaryKeyCandidates,
    migrationNotes: notes,
    rawSummary: summary
  });

  return res.status(201).json({
    status: "ok",
    source_id: sourceId,
    file_id: filename,
    schema_id: newSchemaId,
    parsed_fragments_summary: summary,
    migrationNotes: notes
  });
});

export default router;
