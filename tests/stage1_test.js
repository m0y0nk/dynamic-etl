import axios from "axios";
import fs from "fs";

const BASE = "http://localhost:3000";

async function testStage1() {
  console.log("➡ Testing Stage 1 Upload...");

  const resp = await axios.post(
    BASE + "/upload",
    {
      source_id: "stage1_test",
      file: fs.createReadStream("./tests/sample.txt")
    },
    {
      headers: { "Content-Type": "multipart/form-data" }
    }
  );

  console.log(resp.data);

  console.log("➡ Testing GET /schema...");
  const s = await axios.get(BASE + "/schema?source_id=stage1_test");
  console.log(s.data);

  console.log("➡ Testing GET /schema/history...");
  const h = await axios.get(BASE + "/schema/history?source_id=stage1_test");
  console.log(h.data);
}

testStage1();
