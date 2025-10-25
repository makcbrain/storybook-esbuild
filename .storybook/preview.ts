import type { Preview } from '@makcbrain/storybook-framework-react-esbuild';

const preview: Preview = {
	parameters: {
		controls: {
			matchers: {
				color: /(background|color)$/i,
				date: /Date$/i,
			},
		},
	},
	tags: ['autodocs'],
};

export default preview;
