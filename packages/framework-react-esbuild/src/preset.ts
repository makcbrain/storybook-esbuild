import type { PresetProperty } from 'storybook/internal/types';

import type { StorybookConfig } from './types';

export const core: PresetProperty<'core'> = {
	builder: '@makcbrain/storybook-builder-esbuild',
	renderer: '@storybook/react/preset',
};

export const esbuildFinal: StorybookConfig['esbuildFinal'] = async (config) => {
	return config;
};
