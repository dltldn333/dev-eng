import js from '@eslint/js'
import globals from 'globals'
import tseslint from 'typescript-eslint'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'

export default tseslint.config(
  { ignores: ['out', 'dist', 'node_modules'] },

  // 메인 / 프리로드: Node 환경
  {
    files: ['src/main/**/*.ts', 'src/preload/**/*.ts', 'src/shared/**/*.ts', '*.config.ts'],
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    languageOptions: { globals: globals.node }
  },

  // 렌더러: 브라우저 환경 + React 규칙
  {
    files: ['src/renderer/**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      ...tseslint.configs.recommended,
      reactHooks.configs.flat['recommended-latest'],
      reactRefresh.configs.vite
    ],
    languageOptions: { globals: globals.browser },
    rules: {
      // 넘겨받은 값 중 버릴 것을 구조 분해로 걸러낼 때가 있다. _ 로 시작하면 의도한 것으로 본다.
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }
      ]
    }
  }
)
