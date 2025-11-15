// models/Schema.js
import mongoose from "mongoose";

const fieldSchema = new mongoose.Schema({
  name: String,
  path: String,
  type: String,
  nullable: Boolean,
  example: mongoose.Schema.Types.Mixed,
  confidence: Number,
  source_offsets: [Number],
  suggested_index: { type: Boolean, default: false }
}, { _id: false });

const schemaSchema = new mongoose.Schema({
  sourceId: { type: String, index: true },
  schemaId: String,
  generatedAt: Date,
  version: Number,
  compatibleDbs: [String],
  fields: [fieldSchema],
  primaryKeyCandidates: [String],
  migrationNotes: String,
  rawSummary: Object
});

export default mongoose.model("Schema", schemaSchema);
