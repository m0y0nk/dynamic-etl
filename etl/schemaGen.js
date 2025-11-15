// etl/schemaGen.js
import _ from "lodash";
import jsondiffpatch from "jsondiffpatch";

/**
 * Infer a flattened set of fields from parsed fragments.
 * Works off JSON fragments first, then kv pairs and csv headers as fallback.
 *
 * Field object:
 * { name, path, type, nullable, example, confidence, source_offsets, suggested_index }
 */

function detectType(value) {
  if (value === null || value === undefined) return "null";
  if (_.isArray(value)) return "array";
  if (_.isPlainObject(value)) return "object";
  if (_.isInteger(value)) return "integer";
  if (_.isNumber(value)) return "number";
  if (_.isBoolean(value)) return "boolean";
  // attempt date detection with ISO-ish
  if (_.isString(value)) {
    const s = value.trim();
    // numbers inside strings
    if (/^[0-9]+$/.test(s)) return "integer_string";
    if (/^[0-9]+\.[0-9]+$/.test(s)) return "number_string";
    // simple date-ish heuristics (YYYY-MM-DD or ISO)
    if (/^\d{4}-\d{2}-\d{2}/.test(s) || /^\d{4}T\d{2}:\d{2}/.test(s)) return "date_string";
    return "string";
  }
  return typeof value;
}

function flattenObject(obj, basePath = "$") {
  // returns array of { path, key, value }
  const out = [];
  if (_.isPlainObject(obj)) {
    for (const [k, v] of Object.entries(obj)) {
      const p = `${basePath}.${k}`;
      if (_.isPlainObject(v)) {
        out.push(...flattenObject(v, p));
      } else if (_.isArray(v)) {
        // for arrays, capture as array type and example first element
        out.push({ path: p, key: k, value: v });
        if (v.length && _.isPlainObject(v[0])) {
          out.push(...flattenObject(v[0], `${p}[0]`));
        }
      } else {
        out.push({ path: p, key: k, value: v });
      }
    }
  }
  return out;
}

export function inferSchemaFromParsed(detail) {
  const candidateMap = new Map(); // key -> aggregated info

  // 1) JSON fragments - strongest signals
  const jfrags = detail.jsonFragments || [];
  for (let jf of jfrags) {
    const obj = jf.json;
    const flattened = flattenObject(obj, "$");
    for (const f of flattened) {
      const name = f.key;
      const path = f.path;
      const t = detectType(f.value);
      const rec = candidateMap.get(path) || {
        name,
        path,
        types: new Set(),
        examples: [],
        count: 0,
        offsets: []
      };
      rec.types.add(t);
      rec.examples.push(f.value);
      rec.count++;
      if (jf.offset) rec.offsets.push(jf.offset);
      candidateMap.set(path, rec);
    }
  }

  // 2) JSON-LD
  const jld = detail.jsonLdFragments || [];
  for (const obj of jld) {
    const flattened = flattenObject(obj, "$");
    for (const f of flattened) {
      const name = f.key;
      const path = f.path;
      const t = detectType(f.value);
      const rec = candidateMap.get(path) || {
        name,
        path,
        types: new Set(),
        examples: [],
        count: 0,
        offsets: []
      };
      rec.types.add(t);
      rec.examples.push(f.value);
      rec.count++;
      candidateMap.set(path, rec);
    }
  }

  // 3) KV pairs (we map simple keys to $.<key>)
  const kv = detail.kvPairs || [];
  for (const k of kv) {
    const key = k.key;
    const v = k.value;
    const path = `$.${key.replace(/\s+/g, "_")}`;
    const t = detectType(v);
    const rec = candidateMap.get(path) || {
      name: key,
      path,
      types: new Set(),
      examples: [],
      count: 0,
      offsets: []
    };
    rec.types.add(t);
    rec.examples.push(v);
    rec.count++;
    candidateMap.set(path, rec);
  }

  // 4) CSV blocks - take header row as field names
  const csvBlocks = detail.csvBlocks || [];
  for (const block of csvBlocks) {
    if (!block.length) continue;
    const header = block[0]; // array of header names
    const rows = block.slice(1);
    header.forEach((h, j) => {
      const path = `$.${h.replace(/\s+/g, "_")}`;
      const rec = candidateMap.get(path) || {
        name: h,
        path,
        types: new Set(),
        examples: [],
        count: 0,
        offsets: []
      };
      for (const r of rows.slice(0, 5)) {
        const cell = r[j];
        rec.types.add(detectType(cell));
        rec.examples.push(cell);
        rec.count++;
      }
      candidateMap.set(path, rec);
    });
  }

  // Build fields array
  const fields = [];
  for (const [path, info] of candidateMap.entries()) {
    let types = Array.from(info.types);
    let chosenType;
    if (types.length === 1) chosenType = types[0];
    else {
      // union or prefer non-stringized numeric
      if (types.includes("number")) chosenType = "number";
      else if (types.includes("integer")) chosenType = "integer";
      else chosenType = "string";
    }

    const example = info.examples.find((e) => e !== null && e !== undefined) ?? info.examples[0];
    const nullable = info.types.has("null") || info.examples.some((e) => e === "N/A" || e === "null");
    const confidence = Math.min(0.99, 0.5 + Math.log(1 + info.count) / 10);

    fields.push({
      name: info.name,
      path,
      type: chosenType,
      nullable,
      example,
      confidence: Number(confidence.toFixed(2)),
      source_offsets: info.offsets.slice(0, 5),
      suggested_index: false
    });
  }

  // sort fields for determinism
  const sorted = _.sortBy(fields, ["path"]);
  const schema = {
    generatedAt: new Date(),
    compatibleDbs: ["mongodb", "postgresql"],
    fields: sorted,
    primaryKeyCandidates: sorted.filter(f => /id$/i.test(f.name)).map(f => f.name),
    rawSummary: detail.summary || {}
  };

  return schema;
}

/**
 * Compare two schema objects and produce:
 * - diff (jsondiffpatch)
 * - migrationNotes (human readable)
 */
export function diffSchemas(oldSchema, newSchema) {
  const jdp = jsondiffpatch.create({ objectHash: (obj) => obj.path || JSON.stringify(obj) });
  const delta = jdp.diff(oldSchema, newSchema);
  let notes = [];

  if (!delta) {
    notes.push("No schema changes detected.");
    return { delta: null, notes: notes.join("\n") };
  }

  // Basic analysis: check added/removed fields and type changes
  const oldPaths = new Set((oldSchema.fields || []).map(f => f.path));
  const newPaths = new Set((newSchema.fields || []).map(f => f.path));

  for (const p of newPaths) {
    if (!oldPaths.has(p)) {
      notes.push(`Added field ${p}`);
    }
  }
  for (const p of oldPaths) {
    if (!newPaths.has(p)) {
      notes.push(`Removed field ${p}`);
    }
  }

  // Type changes
  const oldByPath = _.keyBy(oldSchema.fields || [], "path");
  const newByPath = _.keyBy(newSchema.fields || [], "path");
  for (const p of newPaths) {
    if (oldByPath[p] && newByPath[p]) {
      const ot = oldByPath[p].type;
      const nt = newByPath[p].type;
      if (ot !== nt) notes.push(`Type change at ${p}: ${ot} -> ${nt}`);
    }
  }

  if (!notes.length) notes.push("Schema changed (details in delta).");

  return { delta, notes: notes.join("; ") };
}
