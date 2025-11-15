import express from "express";
import Schema from "../models/Schema.js";

const router = express.Router();

// GET /schema?source_id=XYZ
router.get("/", async (req, res) => {
  const s = await Schema.findOne({
    sourceId: req.query.source_id
  }).sort({ version: -1 });

  if (!s) return res.status(404).json({ error: "Schema not found" });

  res.json(s);
});

// GET /schema/history?source_id=XYZ
router.get("/history", async (req, res) => {
  const hist = await Schema.find({
    sourceId: req.query.source_id
  }).sort({ version: 1 });

  res.json({
    source_id: req.query.source_id,
    history: hist
  });
});

export default router;
