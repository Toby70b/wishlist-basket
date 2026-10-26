// Runs after `npm run build` (postbuild). Fails the build if any dev-only mock code or data
// reached dist/. MockWishlistSource contains these scenario Steam IDs, so finding one means
// the mock was bundled, e.g. because something imported it at the top of a file.
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const MARKERS = ['76561190000000001', '[FAKE]'];

function files(dir) {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? files(path) : [path];
  });
}

const leaks = files('dist').flatMap((file) => {
  const text = readFileSync(file, 'utf8');
  return MARKERS.filter((marker) => text.includes(marker)).map((marker) => `${file}: contains "${marker}"`);
});

if (leaks.length) {
  console.error('Mock data found in the production build:\n  ' + leaks.join('\n  '));
  console.error('Load the mock with import() inside an import.meta.env.DEV check, never a top-level import.');
  process.exit(1);
}
console.log('check-no-mocks: no mock data in dist/');
