import mongoose from "mongoose";

const schemaSchema = new mongoose.Schema({
  sourceId: String,
  schemaId: String,
  generatedAt: Date,
  fields: Array,
  compatibleDbs: Array,
  summary: Object,
  version: Number
});

export default mongoose.model("Schema", schemaSchema);
