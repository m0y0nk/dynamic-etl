// tests/stage3_v2_upload.js
import axios from "axios";
import fs from "fs";
import FormData from "form-data";

const BASE = "http://localhost:3000";

async function run() {
  const form = new FormData();
  form.append("source_id", "stage3_test");
  form.append("file", fs.createReadStream("./tests/sample_v2.txt"));

  const r = await axios.post(BASE + "/upload", form, { headers: form.getHeaders() });
  console.log("Upload v2 response:", r.status, r.data);

  const hist = await axios.get(BASE + "/schema/history", { params: { source_id: "stage3_test" }});
  console.log("History (versions):", hist.data.history.map(s => ({ schemaId: s.schemaId, version: s.version, migrationNotes: s.migrationNotes })));
}

run().catch(console.error);
