const fs = require('fs');
const path = require('path');

const projectRoot = path.join(__dirname, '..');
const nodeModulesRoot = path.join(projectRoot, 'node_modules');

if (!fs.existsSync(nodeModulesRoot)) {
  console.log('[fix-expo-tsconfig] node_modules not found; skipping');
  process.exit(0);
}

const targetPackages = [
  'expo-asset',
  'expo-constants',
  'expo-file-system',
  'expo-font',
  'expo-keep-awake',
  'expo-modules-core',
];

function ensureTsconfigBaseAlias() {
  const scriptsRoot = path.join(nodeModulesRoot, 'expo-module-scripts');
  const aliasPath = path.join(scriptsRoot, 'tsconfig.base');

  if (!fs.existsSync(scriptsRoot)) {
    return false;
  }

  if (fs.existsSync(aliasPath)) {
    return false;
  }

  fs.writeFileSync(aliasPath, '{\n  "extends": "./tsconfig.base.json"\n}\n', 'utf8');
  console.log('[fix-expo-tsconfig] created node_modules\\expo-module-scripts\\tsconfig.base alias');
  return true;
}

function patchTsconfigFile(tsconfigPath) {
  if (!fs.existsSync(tsconfigPath)) {
    return false;
  }

  let content = fs.readFileSync(tsconfigPath, 'utf8');
  const original = content;

  // TypeScript can fail to resolve package-style extends inside node_modules.
  // Use an explicit relative path to the sibling package for consistent behavior.
  content = content.replace(
    /"extends"\s*:\s*"expo-module-scripts\/tsconfig\.base(?:\.json)?"/g,
    '"extends": "../expo-module-scripts/tsconfig.base.json"'
  );

  // Add explicit rootDir + declaration for TS 6 diagnostics compatibility.
  if (!/"rootDir"\s*:\s*"\.\/src"/.test(content) || !/"declaration"\s*:\s*true/.test(content)) {
    content = content.replace(
      /"compilerOptions"\s*:\s*\{\s*/,
      '"compilerOptions": {\n    "rootDir": "./src",\n    "declaration": true,\n    '
    );
  }

  if (content !== original) {
    fs.writeFileSync(tsconfigPath, content, 'utf8');
    console.log(`[fix-expo-tsconfig] patched ${path.relative(projectRoot, tsconfigPath)}`);
    return true;
  }

  return false;
}

function hardFixExpoModulesCoreTsconfig() {
  const tsconfigPath = path.join(nodeModulesRoot, 'expo-modules-core', 'tsconfig.json');
  if (!fs.existsSync(tsconfigPath)) {
    return false;
  }

  const desired = `{
  "compilerOptions": {
    "rootDir": "./src",
    "skipLibCheck": true
  },
  "include": ["./src"],
  "exclude": ["**/__mocks__/*", "**/__tests__/*", "**/__rsc_tests__/*"]
}
`;

  const current = fs.readFileSync(tsconfigPath, 'utf8');
  if (current === desired) {
    return false;
  }

  fs.writeFileSync(tsconfigPath, desired, 'utf8');
  console.log('[fix-expo-tsconfig] applied hard fix to node_modules\\expo-modules-core\\tsconfig.json');
  return true;
}

let patchedCount = 0;

if (ensureTsconfigBaseAlias()) {
  patchedCount += 1;
}

for (const pkg of targetPackages) {
  const tsconfigPath = path.join(nodeModulesRoot, pkg, 'tsconfig.json');
  if (patchTsconfigFile(tsconfigPath)) {
    patchedCount += 1;
  }
}

if (hardFixExpoModulesCoreTsconfig()) {
  patchedCount += 1;
}

if (patchedCount === 0) {
  console.log('[fix-expo-tsconfig] no changes needed');
} else {
  console.log(`[fix-expo-tsconfig] patched ${patchedCount} file(s)`);
}
