import express from "express";
import Record from "../models/Record.js";

const router = express.Router();

router.get("/", async (req, res) => {
  const records = await Record.find({ sourceId: req.query.source_id }).limit(10);
  res.json({
    source_id: req.query.source_id,
    records_count: records.length,
    sample: records
  });
});

export default router;
