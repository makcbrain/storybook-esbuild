import type { StorybookConfig } from '@makcbrain/storybook-framework-react-esbuild';

const config: StorybookConfig = {
	stories: ['../stories/**/*.mdx', '../stories/**/*.stories.@(js|jsx|mjs|ts|tsx)'],
	addons: ['@storybook/addon-docs'],
	framework: {
		name: '@makcbrain/storybook-framework-react-esbuild',
		options: {
			builder: {
				esbuildConfig: ({ isProduction }) => {
					return {
						sourcemap: !isProduction,
					};
				},
			},
		},
	},
	esbuildFinal: (config) => {
		return config;
	},
};

export default config;
