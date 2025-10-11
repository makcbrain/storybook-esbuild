// import { dirname, join } from 'node:path';
// import type { StorybookConfig } from '@storybook/react-vite';
import type { StorybookConfig } from '@makcbrain/storybook-framework-react-esbuild';

// /**
//  * This function is used to resolve the absolute path of a package.
//  * It is needed in projects that use Yarn PnP or are set up within a monorepo.
//  */
// function getAbsolutePath(value: string): string {
// 	return dirname(require.resolve(join(value, 'package.json')));
// }
const config: StorybookConfig = {
	stories: ['../stories/**/*.stories.@(js|jsx|mjs|ts|tsx)'],
	addons: ['@storybook/addon-docs'],
	framework: {
		// name: getAbsolutePath('@storybook/react-vite'),
		name: '@makcbrain/storybook-framework-react-esbuild',
		options: {},
	},
	// esbuildFinal: (config) => {
	// 	console.log('=== esbuildFinal storybook/main', config);
	// 	return config;
	// },
};
export default config;
