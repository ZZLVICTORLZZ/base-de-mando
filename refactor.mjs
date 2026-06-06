import fs from 'fs';
import path from 'path';

const basePath = process.cwd();
const srcDir = path.join(basePath, 'src');
const modulesDir = path.join(srcDir, 'modules');
const pagesDir = path.join(srcDir, 'pages');

const dirs = ['core', 'admin', 'flota', 'operacion', 'recaudacion', 'taquilla', 'archivo'];

if (!fs.existsSync(modulesDir)) fs.mkdirSync(modulesDir);
dirs.forEach(d => {
  const p = path.join(modulesDir, d);
  if (!fs.existsSync(p)) fs.mkdirSync(p);
});

// Move files if they exist
const moveFile = (src, dest) => {
  if (fs.existsSync(src)) {
    fs.renameSync(src, dest);
    console.log(`Moved ${src} to ${dest}`);
  }
};

moveFile(path.join(pagesDir, 'Login.tsx'), path.join(modulesDir, 'core', 'Login.tsx'));
moveFile(path.join(pagesDir, 'Administracion.tsx'), path.join(modulesDir, 'admin', 'Administracion.tsx'));
moveFile(path.join(pagesDir, 'Unidades.tsx'), path.join(modulesDir, 'flota', 'Unidades.tsx'));
moveFile(path.join(pagesDir, 'Servicio.tsx'), path.join(modulesDir, 'operacion', 'Servicio.tsx'));

// Also move Layout and supabaseClient to core
const componentsDir = path.join(srcDir, 'components');
const libDir = path.join(srcDir, 'lib');

moveFile(path.join(componentsDir, 'Layout.tsx'), path.join(modulesDir, 'core', 'Layout.tsx'));
moveFile(path.join(libDir, 'supabaseClient.ts'), path.join(modulesDir, 'core', 'supabaseClient.ts'));

console.log("Refactoring directories done.");
