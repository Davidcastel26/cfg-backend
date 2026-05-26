/**
 * Flat ESLint config for the Service-Repository (MVC) layout. Enforces the data
 * flow controllers → services → repositories/models: controllers may not import
 * repositories or models directly.
 *
 * NOTE: requires `typescript-eslint` to parse `.ts` — the one tool missing from
 * the scaffolded package.json. Install with `npm i -D typescript-eslint`. Until
 * then `npm run lint` no-ops with the warning below (it does not crash).
 */
let tseslint;
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  tseslint = require('typescript-eslint');
} catch {
  // eslint-disable-next-line no-console
  console.warn(
    '[eslint] "typescript-eslint" is not installed — install it to enable TypeScript linting.',
  );
  module.exports = [{ ignores: ['**/*'] }];
}

if (tseslint) {
  module.exports = tseslint.config(
    { ignores: ['dist/**', 'node_modules/**', 'coverage/**', 'openapi.json'] },
    ...tseslint.configs.recommended,
    {
      files: ['src/controllers/**/*.ts'],
      rules: {
        'no-restricted-imports': [
          'error',
          {
            patterns: [
              {
                group: ['**/repositories/**', '**/models', '**/models/**'],
                message: 'Controllers must go through services, not repositories/models directly.',
              },
            ],
          },
        ],
      },
    },
  );
}
