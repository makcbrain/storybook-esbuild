import dedent from 'dedent';

/**
 * Generates setup module - must be loaded first to set up Storybook globals
 */
export const generateSetupCode = (): string => {
	return dedent`
		import { setup } from 'storybook/internal/preview/runtime';

		setup();
	`;
};
