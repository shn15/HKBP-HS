import fs from "fs";
import path from "path";

const configPath = path.join(process.cwd(), "firebase-applet-config.json");
const config = JSON.parse(fs.readFileSync(configPath, "utf-8"));

const url = `https://firestore.googleapis.com/v1/projects/${config.projectId}/databases/${config.firestoreDatabaseId}/documents/kv_store/test_doc?key=${config.apiKey}`;

async function run() {
  try {
    console.log("Writing to Firestore REST API...");
    const writeResponse = await fetch(url, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        fields: {
          value: { stringValue: "hello from REST API " + Date.now() }
        }
      })
    });
    const writeData = await writeResponse.json();
    console.log("Write response status:", writeResponse.status);
    console.log("Write response data:", JSON.stringify(writeData, null, 2));

    console.log("\nReading from Firestore REST API...");
    const readResponse = await fetch(url);
    const readData = await readResponse.json();
    console.log("Read response status:", readResponse.status);
    console.log("Read response data:", JSON.stringify(readData, null, 2));

  } catch (err) {
    console.error("REST API error:", err);
  }
}

run();
