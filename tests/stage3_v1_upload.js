// tests/stage3_v1_upload.js
import axios from "axios";
import fs from "fs";
import FormData from "form-data";

const BASE = "http://localhost:3000";

async function run() {
  const form = new FormData();
  form.append("source_id", "stage3_test");
  form.append("file", fs.createReadStream("./tests/sample_v1.txt"));

  const r = await axios.post(BASE + "/upload", form, { headers: form.getHeaders() });
  console.log("Upload v1 response:", r.status, r.data);

  const sch = await axios.get(BASE + "/schema", { params: { source_id: "stage3_test" }});
  console.log("Current schema:", sch.data);

  const hist = await axios.get(BASE + "/schema/history", { params: { source_id: "stage3_test" }});
  console.log("History length:", hist.data.history.length);
}

run().catch(console.error);
