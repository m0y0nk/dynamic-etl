import express from "express";
import uploadRouter from "./routes/upload.js";
import schemaRouter from "./routes/schema.js";
import recordsRouter from "./routes/records.js";
import mongoose from "mongoose";

const app = express();
app.use(express.json());

app.use("/upload", uploadRouter);
app.use("/schema", schemaRouter);
app.use("/records", recordsRouter);

import dotenv from "dotenv";
dotenv.config();

const start = async () => {
  await mongoose.connect(process.env.DB_URL);
  console.log("MongoDB connected");

  app.listen(3000, () => console.log("Server running on port 3000"));
};

start();
