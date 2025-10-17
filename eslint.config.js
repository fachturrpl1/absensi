module.exports = {
  ignores: [
    'node_modules/',
    '.next/',
    '.turbo/',
    'dist/',
    'build/',
    '.pnpm-store/',
    '.trash/',
    'coverage/'
  ],
  languageOptions: {
    ecmaVersion: 2023,
    sourceType: 'module',
  },
  plugins: ['@typescript-eslint', 'react'],
  settings: {
    react: {
      version: 'detect'
    }
  }
}
