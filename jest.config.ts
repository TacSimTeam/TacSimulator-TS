import type { Config } from '@jest/types';

const config: Config.InitialOptions = {
  transform: {
    '^.+\\.tsx?$': 'ts-jest',
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'json', 'jsx'],
  roots: ['<rootDir>/src/', '<rootDir>/test/'],
};

export default config;
