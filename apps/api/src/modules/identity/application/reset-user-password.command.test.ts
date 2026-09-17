import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

describe('Comando local de redefinição de senha', () => {
  it('expõe um comando seguro para redefinir a senha de um usuário', () => {
    const repositoryRoot = resolve(process.cwd(), '../..');

    const packageJsonPath = resolve(repositoryRoot, 'package.json');

    const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8')) as {
      scripts?: Record<string, string>;
    };

    expect(packageJson.scripts?.['admin:reset-password']).toBe(
      'powershell -NoProfile -ExecutionPolicy Bypass -File ./scripts/admin-reset-password.ps1',
    );

    const powershellScriptPath = resolve(repositoryRoot, 'scripts', 'admin-reset-password.ps1');

    const workerScriptPath = resolve(repositoryRoot, 'scripts', 'admin-reset-password.ts');

    expect(existsSync(powershellScriptPath)).toBe(true);

    expect(existsSync(workerScriptPath)).toBe(true);

    const powershellScript = readFileSync(powershellScriptPath, 'utf8');

    expect(powershellScript).toContain('-AsSecureString');

    expect(powershellScript).toContain('APEX_RESET_EMAIL');

    expect(powershellScript).toContain('APEX_RESET_PASSWORD');

    expect(powershellScript).toContain('Remove-Item Env:APEX_RESET_PASSWORD');
  });
});
