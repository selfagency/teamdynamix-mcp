import { copyFile, mkdir, readFile, writeFile } from 'fs/promises';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function main() {
  const rootPkgPath = resolve(__dirname, '..', 'package.json');
  const outDir = resolve(__dirname, '..', 'dist');
  const raw = await readFile(rootPkgPath, 'utf8');
  const { name, version, description, keywords, homepage, bugs, repository, license, author } = JSON.parse(raw);

  const distPkg = {
    name,
    version,
    description,
    keywords,
    homepage,
    bugs,
    repository,
    license,
    author,
    type: 'module',
    main: './index.js',
    types: './index.d.ts',
    files: ['./index.js', './index.js.map', './index.d.ts'],
    bin: {
      'mcp-server-template': './index.js',
    },
    exports: {
      '.': {
        import: './index.js',
        types: './index.d.ts',
      },
    },
    dependencies: JSON.parse(raw).dependencies,
  };

  await mkdir(outDir, { recursive: true });
  await writeFile(resolve(outDir, 'package.json'), JSON.stringify(distPkg, null, 2) + '\n', 'utf8');
  console.log('Wrote', resolve(outDir, 'package.json'));

  const readmeSrc = resolve(__dirname, '..', 'README.md');
  const readmeDest = resolve(outDir, 'README.md');
  try {
    await copyFile(readmeSrc, readmeDest);
    console.log('Copied', readmeSrc, 'to', readmeDest);
  } catch {
    console.warn('No README.md found; skipping copy.');
  }
}

main().catch(err => {
  console.error(err);
  process.exitCode = 1;
});
