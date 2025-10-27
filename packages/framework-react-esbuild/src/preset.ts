import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import type { PresetProperty } from 'storybook/internal/types';

import type { StorybookConfig } from './types.ts';

const require = createRequire(import.meta.url);

const getAbsolutePath = (value: string): string => {
	return dirname(require.resolve(join(value, 'package.json')));
};

export const core: PresetProperty<'core'> = {
	builder: getAbsolutePath('@makcbrain/storybook-builder-esbuild'),
	renderer: getAbsolutePath('@storybook/react'),
};

export const esbuildFinal: StorybookConfig['esbuildFinal'] = async (config) => {
	return config;
};
