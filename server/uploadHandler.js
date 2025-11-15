// uploadHandler.js
import fs from 'fs/promises';
import { parseFileContent } from './parser.js';
import { getDb } from './mongoClient.js';
import { manageSchemaEvolution } from './schemaManager.js';

export async function handleUpload(req, res) {
  try {
    const { source_id, version } = req.body;
    const file = req.file; // File metadata from multer

    if (!file) {
      return res.status(400).send({ error: 'No file uploaded.' });
    }

    // 1. Read the file content
    const fileContent = await fs.readFile(file.path, 'utf-8');
    
    // 2. Parse the unstructured content (The "Magic")
    // This is the most complex step
    const { parsedData, fragmentsSummary } = await parseFileContent(fileContent, file.mimetype); 

    // 3. Manage Schema Generation & Evolution
    // This function will diff the new data against the old schema
    // and create a new schema version if needed. [cite: 10]
    const { schemaId, migrationNotes } = await manageSchemaEvolution(source_id, parsedData); 

    // 4. Ingest the Data
    // Use a dynamic collection name based on the source_id 
    const dataCollectionName = `data_${source_id}`;
    const db = await getDb();
    
    // MongoDB's native driver is schema-less. Just insert the data.
    // If parsedData is an array, use insertMany
    await db.collection(dataCollectionName).insertMany(parsedData);

    // 5. Clean up the temp file
    await fs.unlink(file.path);

    // 6. Send the success response [cite: 61, 141-147]
    res.status(201).json({
      status: "ok",
      source_id: source_id,
      file_id: file.filename, // Use multer's generated ID or create your own
      schema_id: schemaId,
      parsed_fragments_summary: fragmentsSummary 
    });

  } catch (error) {
    console.error('Upload failed:', error);
    res.status(500).send({ error: 'Internal server error' });
  }
}