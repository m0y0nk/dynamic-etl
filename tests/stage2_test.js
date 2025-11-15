import axios from "axios";
import fs from "fs";
import FormData from "form-data";

const BASE = "http://localhost:3000";

async function testStage2() {
  const form = new FormData();
  form.append("source_id", "stage2_test");
  form.append("file", fs.createReadStream("./tests/sample_mixed.txt"));

  const resp = await axios.post(BASE + "/upload", form, {
    headers: form.getHeaders(),
  });

  console.log("UPLOAD RESULT:");
  console.log(resp.data);

  console.log("\nSCHEMA:");
  const schema = await axios.get(BASE + "/schema?source_id=stage2_test");
  console.log(schema.data);

  console.log("\nRECORDS:");
  const records = await axios.get(BASE + "/records?source_id=stage2_test");
  console.log(records.data);
}

testStage2().catch(console.error);
