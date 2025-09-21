import type { EsbuildBuilder } from './types';
export * from './types';
export declare const bail: () => Promise<void>;
export declare const start: EsbuildBuilder['start'];
export declare const build: EsbuildBuilder['build'];
