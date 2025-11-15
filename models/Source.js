import mongoose from "mongoose";

const sourceSchema = new mongoose.Schema({
  sourceId: { type: String, unique: true },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model("Source", sourceSchema);
