import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const read = (path: string): string => readFileSync(join(process.cwd(), path), 'utf8');

describe('dev proxy', () => {
  const proxy = JSON.parse(read('proxy.conf.json'));

  it.each(['/auth', '/users', '/search'])('forwards %s to the backend', (path) => {
    expect(proxy[path].target).toBe('http://localhost:8080');
  });

  it('is used by ng serve', () => {
    const angular = JSON.parse(read('angular.json'));
    const serve = angular.projects['zbar-showtime-frontend'].architect.serve;
    expect(serve.options.proxyConfig).toBe('proxy.conf.json');
  });
});
