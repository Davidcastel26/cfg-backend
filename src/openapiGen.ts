import { writeFileSync } from 'node:fs';
import path from 'node:path';
import { buildOpenApiSpec } from './utils/swagger';

const outFile = path.resolve(process.cwd(), 'openapi.json');
writeFileSync(outFile, JSON.stringify(buildOpenApiSpec(), null, 2), 'utf8');
// eslint-disable-next-line no-console
console.log(`OpenAPI document written to ${outFile}`);
