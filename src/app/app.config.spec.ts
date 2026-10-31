import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const read = (path: string): string => readFileSync(join(process.cwd(), path), 'utf8');

describe('zoneless setup', () => {
  it('provides zoneless change detection in appConfig', () => {
    expect(read('src/app/app.config.ts')).toContain('provideZonelessChangeDetection()');
  });

  it('does not depend on zone.js', () => {
    const { dependencies, devDependencies } = JSON.parse(read('package.json'));
    expect({ ...dependencies, ...devDependencies }).not.toHaveProperty('zone.js');
  });
});
