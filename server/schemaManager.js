// schemaManager.js
import { getDb } from './mongoClient.js';
import { diff } from 'deep-diff'; // A library to compare objects

const SCHEMA_COLLECTION = '_schemas';

export async function manageSchemaEvolution(source_id, parsedData) {
  const db = await getDb();
  const schemaCollection = db.collection(SCHEMA_COLLECTION);

  // 1. Get the LATEST current schema for this source_id
  const currentSchema = await schemaCollection.findOne(
    { source_id: source_id },
    { sort: { version: -1 } }
  );

  // 2. Generate a "candidate" schema from the NEW data
  const candidateSchema = generateSchemaFromData(parsedData, source_id);

  if (!currentSchema) {
    // First upload for this source_id. Save as v1.
    candidateSchema.version = 1;
    candidateSchema.generated_at = new Date(); 
    const result = await schemaCollection.insertOne(candidateSchema);
    return { schemaId: result.insertedId, migrationNotes: "Initial schema creation." };
  }

  // 3. Compare new schema with current schema [cite: 111, 113]
  // We only compare the 'fields' part
  const changes = diff(currentSchema.fields, candidateSchema.fields);

  if (!changes) {
    // No changes detected. Return the existing schema ID. 
    // This handles idempotency for identical content.
    return { schemaId: currentSchema._id, migrationNotes: "No schema changes detected." };
  }

  // 4. Changes detected! Create a new schema version. [cite: 77]
  const newVersion = currentSchema.version + 1;
  candidateSchema.version = newVersion;
  candidateSchema.generated_at = new Date();
  
  // Add migration notes [cite: 72, 158]
  candidateSchema.migration_notes = generateMigrationNotes(changes); 
  
  const result = await schemaCollection.insertOne(candidateSchema);
  return { schemaId: result.insertedId, migrationNotes: candidateSchema.migration_notes };
}

/**
 * Generates a schema definition from an array of data objects.
 */
function generateSchemaFromData(data, source_id) {
  const fieldMap = new Map();

  // Loop through every record to discover all fields and types
  data.forEach(record => {
    Object.keys(record).forEach(key => {
      const value = record[key];
      const type = getMongoType(value);
      
      if (!fieldMap.has(key)) {
        fieldMap.set(key, { name: key, types: new Set(), confidence: 0.0, example_value: value });
      }
      
      const fieldDef = fieldMap.get(key);
      fieldDef.types.add(type);
      fieldDef.confidence = 1.0; // Confidence logic would be more complex [cite: 48]
    });
  });

  // Format for MongoDB schema document
  const fields = Array.from(fieldMap.values()).map(def => ({
    name: def.name,
    path: `$.${def.name}`, // [cite: 154]
    type: def.types.size > 1 ? Array.from(def.types) : def.types.values().next().value, // Handles mixed types [cite: 88, 166]
    nullable: def.types.has('null'),
    example_value: def.example_value,
    confidence: def.confidence,
  }));

  return {
    source_id: source_id,
    compatible_dbs: ["mongodb"], // [cite: 69, 152]
    fields: fields,
    primary_key_candidates: ['id', '_id'], // [cite: 71, 157]
  };
}

function getMongoType(value) {
  if (value === null || value === undefined) return 'null';
  if (typeof value === 'number') return 'double'; // or 'int'/'long'
  if (typeof value === 'string') return 'string';
  if (typeof value === 'boolean') return 'bool';
  if (value instanceof Date) return 'date';
  if (Array.isArray(value)) return 'array';
  if (typeof value === 'object') return 'object';
  return 'string'; // Default fallback
}

function generateMigrationNotes(changes) {
  // Logic to turn the `diff` output into human-readable notes
  // E.g., "Added field 'price'. Removed field 'price_usd'." [cite: 173]
  return "Schema updated with changes.";
}