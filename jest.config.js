export default {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  // Performance optimizations
  maxWorkers: '50%',
  cache: true,
  cacheDirectory: '<rootDir>/node_modules/.cache/jest',
  testEnvironmentOptions: {
    url: 'http://localhost/',
  },
  globals: {
    importMeta: {
      env: {
        VITE_USE_MOCK_API: 'true',
        VITE_SUPABASE_URL: '',
        VITE_SUPABASE_ANON_KEY: '',
      },
    },
  },
  setupFilesAfterEnv: ['<rootDir>/src/test/setup.ts'],
  moduleNameMapper: {
    '^@/(.*\\.svg)$': '<rootDir>/src/test/__mocks__/fileMock.ts',
    '^@/lib/supabase$': '<rootDir>/src/test/__mocks__/supabase.ts',
    '^@/services$': '<rootDir>/src/test/__mocks__/services.ts',
    '^@/config/env$': '<rootDir>/src/test/__mocks__/env.ts',
    '^@/(.*)$': '<rootDir>/src/$1',
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '\\.(svg|png|jpg|jpeg|gif)$': '<rootDir>/src/test/__mocks__/fileMock.ts',
    '^\\.\\./lib/supabase$': '<rootDir>/src/test/__mocks__/supabase.ts',
    '^\\.\\./services$': '<rootDir>/src/test/__mocks__/services.ts',
    '^\\.\\./config/env$': '<rootDir>/src/test/__mocks__/env.ts',
  },
  transform: {
    '^.+\\.(ts|tsx)$': [
      'ts-jest',
      {
        tsconfig: 'tsconfig.test.json',
      },
    ],
  },
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/main.tsx',
    '!src/vite-env.d.ts',
  ],
  coverageReporters: ['text', 'lcov', 'html'],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
  testMatch: [
    '<rootDir>/src/**/__tests__/**/*.{ts,tsx}',
    '<rootDir>/src/**/*.{test,spec}.{ts,tsx}',
  ],
};
