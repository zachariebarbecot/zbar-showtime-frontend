import { execFile } from 'node:child_process';
import { mkdtempSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { Server, createServer } from 'node:http';
import { AddressInfo } from 'node:net';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { promisify } from 'node:util';

const run = promisify(execFile);

const spec = { openapi: '3.1.0', info: { title: 'demo', version: 'v0' }, paths: {} };

describe('scripts/fetch-openapi.mjs', () => {
  let dir: string;
  let file: string;
  let server: Server | undefined;

  const fetchSpec = (url: string) =>
    run('node', ['scripts/fetch-openapi.mjs'], {
      env: { ...process.env, OPENAPI_URL: url, OPENAPI_FILE: file },
    });

  const serve = async (body: string): Promise<string> => {
    const started = createServer((_, res) => res.end(body));
    server = started;
    await new Promise<void>((resolve) => started.listen(0, '127.0.0.1', resolve));
    return `http://127.0.0.1:${(started.address() as AddressInfo).port}/v3/api-docs`;
  };

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'openapi-'));
    file = join(dir, 'api-docs.json');
  });

  afterEach(() => {
    server?.close();
    server = undefined;
  });

  it('writes the spec as JSON indented with 2 spaces', async () => {
    const url = await serve(JSON.stringify(spec));

    await fetchSpec(url);

    expect(readFileSync(file, 'utf8')).toBe(`${JSON.stringify(spec, null, 2)}\n`);
  });

  it('exits non zero with an explicit message and keeps the file when the backend is down', async () => {
    writeFileSync(file, 'previous');

    const failure = await fetchSpec('http://127.0.0.1:1/v3/api-docs').then(
      () => undefined,
      (error: { code: number; stderr: string }) => error,
    );

    expect(failure?.code).toBe(1);
    expect(failure?.stderr).toContain('http://127.0.0.1:1/v3/api-docs');
    expect(readFileSync(file, 'utf8')).toBe('previous');
    expect(readdirSync(dir)).toEqual(['api-docs.json']);
  });

  it('keeps the file when the response is not an OpenAPI document', async () => {
    writeFileSync(file, 'previous');
    const url = await serve(JSON.stringify({ hello: 'world' }));

    const failure = await fetchSpec(url).then(
      () => undefined,
      (error: { code: number; stderr: string }) => error,
    );

    expect(failure?.code).toBe(1);
    expect(readFileSync(file, 'utf8')).toBe('previous');
    expect(readdirSync(dir)).toEqual(['api-docs.json']);
  });
});
