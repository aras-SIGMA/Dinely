import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';

function getFilesRecursively(dir: string, extensions: string[]): string[] {
  if (!existsSync(dir)) return [];
  const files: string[] = [];
  const entries = readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...getFilesRecursively(fullPath, extensions));
    } else if (entry.isFile()) {
      if (extensions.some((ext) => entry.name.endsWith(ext))) {
        files.push(fullPath);
      }
    }
  }

  return files;
}

async function runTests() {
  console.log('--- TEST SUITE: BE-05 (Security Audit: Secret Key Leakage Protection) ---');
  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, actual?: any) {
    if (condition) {
      console.log(`[PASS] ${testName}`);
      passed++;
    } else {
      console.error(
        `[FAIL] ${testName}`,
        actual !== undefined ? `Actual: ${JSON.stringify(actual)}` : ''
      );
      failed++;
    }
  }

  const rootDir = resolve(process.cwd());
  const srcDir = join(rootDir, 'src');
  const distDir = join(rootDir, 'dist');

  const FORBIDDEN_SECRET_NAMES = [
    'SUPABASE_SERVICE_ROLE_KEY',
    'MIDTRANS_SERVER_KEY',
    'CLOUDINARY_API_SECRET',
    'GEMINI_API_KEY',
  ];

  // TC-01: Tidak ada nama environment variable rahasia di source code frontend (src/)
  {
    const srcFiles = getFilesRecursively(srcDir, ['.ts', '.svelte', '.js', '.json', '.html', '.css']);
    const violations: { file: string; secret: string }[] = [];

    for (const file of srcFiles) {
      const content = readFileSync(file, 'utf8');
      for (const secret of FORBIDDEN_SECRET_NAMES) {
        if (content.includes(secret)) {
          violations.push({ file, secret });
        }
      }
    }

    assert(
      violations.length === 0,
      'TC-01: Tidak ada secret key name (SERVICE_ROLE, SERVER_KEY, API_SECRET, GEMINI_API_KEY) di src/',
      violations
    );
  }

  // TC-02: Tidak ada akses process.env langsung di source code frontend (src/)
  {
    const srcFiles = getFilesRecursively(srcDir, ['.ts', '.svelte', '.js']);
    const processEnvMatches: string[] = [];

    for (const file of srcFiles) {
      const content = readFileSync(file, 'utf8');
      if (content.includes('process.env')) {
        processEnvMatches.push(file);
      }
    }

    assert(
      processEnvMatches.length === 0,
      'TC-02: Tidak ada akses process.env di src/ (wajib menggunakan import.meta.env)',
      processEnvMatches
    );
  }

  // TC-03: Frontend (src/) tidak melakukan import langsung modul backend (api/)
  {
    const srcFiles = getFilesRecursively(srcDir, ['.ts', '.svelte', '.js']);
    const importViolations: { file: string; line: string }[] = [];
    const apiImportRegex = /(?:from\s+['"]|import\s*\(\s*['"])(?:(?:\.\.\/)+api|@\/api|\/api)(?:\/|['"])/;

    for (const file of srcFiles) {
      const lines = readFileSync(file, 'utf8').split('\n');
      for (const line of lines) {
        if (
          (line.includes('import ') || line.includes('from ')) &&
          (apiImportRegex.test(line) || line.includes('../api/') || line.includes('@/api'))
        ) {
          importViolations.push({ file, line: line.trim() });
        }
      }
    }

    assert(
      importViolations.length === 0,
      'TC-03: Tidak ada modul backend (api/) yang diimpor langsung ke frontend (src/)',
      importViolations
    );
  }

  // TC-04: Seluruh environment variable di src/ memiliki prefix VITE_
  {
    const srcFiles = getFilesRecursively(srcDir, ['.ts', '.svelte', '.js']);
    const nonViteEnvUsages: { file: string; match: string }[] = [];
    // Mendukung dot notation (import.meta.env.NAME) dan bracket notation (import.meta.env['NAME'])
    const envRegex = /import\.meta\.env(?:\.([A-Za-z0-9_]+)|\[['"`]([A-Za-z0-9_]+)['"`]\])/g;

    for (const file of srcFiles) {
      const content = readFileSync(file, 'utf8');
      let match;
      while ((match = envRegex.exec(content)) !== null) {
        const varName = match[1] || match[2];
        if (varName !== 'DEV' && varName !== 'PROD' && varName !== 'MODE' && varName !== 'SSR') {
          if (!varName.startsWith('VITE_')) {
            nonViteEnvUsages.push({ file, match: varName });
          }
        }
      }
    }

    assert(
      nonViteEnvUsages.length === 0,
      'TC-04: Seluruh variabel import.meta.env di src/ diawali prefix aman VITE_',
      nonViteEnvUsages
    );
  }

  // TC-05: Tidak ada secret key yang bocor ke bundle production (dist/)
  {
    const distFiles = getFilesRecursively(distDir, ['.js', '.html', '.css']);
    const leakedInDist: { file: string; secret: string }[] = [];

    for (const file of distFiles) {
      const content = readFileSync(file, 'utf8');
      for (const secret of FORBIDDEN_SECRET_NAMES) {
        if (content.includes(secret)) {
          leakedInDist.push({ file, secret });
        }
      }
    }

    assert(
      distFiles.length > 0 && leakedInDist.length === 0,
      'TC-05: Verifikasi bundle production (dist/) bersih dari secret keys backend',
      { distFileCount: distFiles.length, leakedInDist }
    );
  }

  // TC-06: File .gitignore melindungi file environment lokal (.env, .env.*)
  {
    const gitignorePath = join(rootDir, '.gitignore');
    const content = existsSync(gitignorePath) ? readFileSync(gitignorePath, 'utf8') : '';
    const hasEnv = content.split('\n').some((l) => l.trim() === '.env');
    const hasEnvWildcard = content.split('\n').some((l) => l.trim().startsWith('.env.'));

    assert(
      hasEnv && hasEnvWildcard,
      'TC-06: File .gitignore memproteksi .env dan .env.* dari commit git',
      { hasEnv, hasEnvWildcard }
    );
  }

  // TC-07: Template .env.example hanya memuat dummy/placeholder, bukan secret asli
  {
    const envExamplePath = join(rootDir, '.env.example');
    const content = existsSync(envExamplePath) ? readFileSync(envExamplePath, 'utf8') : '';

    const isDummySupabase = content.includes('your-supabase-service-role-key');
    const isDummyMidtrans = content.includes('SB-Mid-server-your-key');
    const isDummyCloudinary = content.includes('your-api-secret');
    const isDummyGemini = content.includes('your-gemini-api-key');

    assert(
      isDummySupabase && isDummyMidtrans && isDummyCloudinary && isDummyGemini,
      'TC-07: Template .env.example hanya memuat nilai dummy placeholder',
      { isDummySupabase, isDummyMidtrans, isDummyCloudinary, isDummyGemini }
    );
  }

  // TC-08: Tidak ada nilai secret key aktual (.env) maupun pattern token backend di src/ dan dist/
  {
    const envPath = join(rootDir, '.env');
    const envContent = existsSync(envPath) ? readFileSync(envPath, 'utf8') : '';
    const secretValuesToCheck: { key: string; value: string }[] = [];

    for (const key of FORBIDDEN_SECRET_NAMES) {
      // Ambil dari .env atau process.env
      const match = envContent.match(new RegExp(`^\\s*${key}\\s*=\\s*(.*)$`, 'm'));
      const valFromEnv = match ? match[1].trim().replace(/^['"]|['"]$/g, '') : '';
      const valFromProc = process.env[key] ? String(process.env[key]).trim() : '';
      const val = valFromProc || valFromEnv;

      if (val && val.length > 5 && !val.includes('your-') && !val.includes('placeholder')) {
        secretValuesToCheck.push({ key, value: val });
      }
    }

    const allClientFiles = [
      ...getFilesRecursively(srcDir, ['.ts', '.svelte', '.js', '.json', '.html', '.css']),
      ...getFilesRecursively(distDir, ['.js', '.html', '.css']),
    ];

    const leakedValues: { file: string; key: string }[] = [];
    const patternViolations: { file: string; pattern: string }[] = [];

    // Signature patterns untuk backend secrets
    const midtransServerPattern = /(?:SB-)?Mid-server-[a-zA-Z0-9_\-]{10,}/;
    const geminiKeyPattern = /AIzaSy[a-zA-Z0-9_\-]{30,}/;
    const jwtPattern = /eyJ[a-zA-Z0-9_\-]+\.eyJ[a-zA-Z0-9_\-]+\.[a-zA-Z0-9_\-]+/g;

    for (const file of allClientFiles) {
      const content = readFileSync(file, 'utf8');

      // 1. Cek nilai aktual dari .env / process.env
      for (const secret of secretValuesToCheck) {
        if (content.includes(secret.value)) {
          leakedValues.push({ file, key: secret.key });
        }
      }

      // 2. Cek pattern token rahasia
      if (midtransServerPattern.test(content)) {
        patternViolations.push({ file, pattern: 'Midtrans Server Key pattern' });
      }
      if (geminiKeyPattern.test(content)) {
        patternViolations.push({ file, pattern: 'Gemini API Key pattern' });
      }

      // 3. Cek JWT dengan role service_role
      let jwtMatch;
      while ((jwtMatch = jwtPattern.exec(content)) !== null) {
        try {
          const payloadBase64 = jwtMatch[0].split('.')[1];
          const payload = JSON.parse(Buffer.from(payloadBase64, 'base64').toString('utf8'));
          if (payload.role === 'service_role') {
            patternViolations.push({ file, pattern: 'Supabase service_role JWT' });
          }
        } catch {
          // ignore parsing error
        }
      }
    }

    assert(
      leakedValues.length === 0 && patternViolations.length === 0,
      'TC-08: Nilai secret key aktual (.env) dan signature token backend tidak ada di src/ maupun dist/',
      { secretCountAudited: secretValuesToCheck.length, leakedValues, patternViolations }
    );
  }

  console.log(`\nHasil: ${passed} Passed, ${failed} Failed`);
  if (failed > 0) process.exit(1);
}

runTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
