import { mkdirSync, renameSync, rmSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';

const url = process.env.OPENAPI_URL ?? 'http://localhost:8080/v3/api-docs';
const file = process.env.OPENAPI_FILE ?? 'openapi/api-docs.json';
const temporary = `${file}.tmp`;

try {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  const spec = await response.json();
  if (typeof spec.openapi !== 'string') {
    throw new Error('response has no "openapi" field');
  }
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(temporary, `${JSON.stringify(spec, null, 2)}\n`);
  renameSync(temporary, file);
} catch (error) {
  rmSync(temporary, { force: true });
  console.error(`Cannot fetch the OpenAPI spec from ${url}: ${error.message}`);
  process.exit(1);
}
