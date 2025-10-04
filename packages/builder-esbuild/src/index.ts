import type { BuildContext } from 'esbuild';

import type { EsbuildBuilder } from './types.ts';
import { createEsbuildContext } from './utils/esbuild-context.js';
import { generateIframeHTML } from './utils/generate-iframe.js';
import { listStories } from './utils/list-stories.js';

export type * from './types.ts';

let ctx: BuildContext;

export const bail = async (): Promise<void> => {
	return ctx?.dispose();
};

export const start: EsbuildBuilder['start'] = async (params) => {
	const { startTime, options, router } = params;

	// Get all story files
	const stories = await listStories(options);

	// Create ESBuild context (single initialization)
	ctx = await createEsbuildContext(stories, options);

	// Start ESBuild's built-in dev server
	const serveResult = await ctx.serve({
		servedir: '.storybook/esbuild-out',
		port: 0, // Auto-select port
	});

	// ESBuild server URL for direct access from browser
	const esbuildServerUrl = `http://localhost:${serveResult.port}`;

	console.log(`[ESBuild Builder] Dev server started at ${esbuildServerUrl}`);

	// Serve iframe.html with ESBuild server URL and stories
	router.get('/iframe.html', async (_req, res) => {
		const html = await generateIframeHTML(options, stories, esbuildServerUrl);
		res.setHeader('Content-Type', 'text/html; charset=utf-8');
		res.statusCode = 200;
		res.write(html);
		res.end();
	});

	return {
		bail,
		stats: {
			toJson: () => {
				return {
					message: 'ESBuild stats',
				};
			},
		},
		totalTime: process.hrtime(startTime),
	};
};

export const build: EsbuildBuilder['build'] = async () => {
	// TODO: Implement production build
	console.log('[ESBuild Builder] Production build not yet implemented');
};
