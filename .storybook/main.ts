// import type { StorybookConfig } from '@storybook/react-vite';

import type { StorybookConfig } from '@makcbrain/storybook-framework-react-esbuild';

const config: StorybookConfig = {
	stories: ['../stories/**/*.mdx', '../stories/**/*.stories.@(js|jsx|mjs|ts|tsx)'],
	addons: ['@storybook/addon-docs'],
	framework: {
		// name: '@storybook/react-vite',
		name: '@makcbrain/storybook-framework-react-esbuild',
		options: {},
	},
	// esbuildFinal: (config) => {
	// 	console.log('=== esbuildFinal storybook/main', config);
	// 	return config;
	// },
};
export default config;
