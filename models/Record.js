 import mongoose from "mongoose";

const recordSchema = new mongoose.Schema({
  sourceId: String,
  rawFile: String,
  parsed: Object
});

export default mongoose.model("Record", recordSchema);
