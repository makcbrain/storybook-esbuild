import type { BuildContext } from 'esbuild';

import type { EsbuildBuilder } from './types.ts';
import { createEsbuildContext } from './utils/createEsbuildContext.js';
import { generateIframeHtml } from './utils/generateIframeHtml.js';
import { listStories } from './utils/listStories.js';

export type * from './types.ts';

let ctx: BuildContext;

export const bail = async (): Promise<void> => {
	return ctx?.dispose();
};

export const start: EsbuildBuilder['start'] = async (params) => {
	const { startTime, options, router } = params;

	const stories = await listStories(options);

	ctx = await createEsbuildContext(stories, options);

	const serveResult = await ctx.serve({
		servedir: '.storybook/esbuild-out',
		port: 0, // Auto-select port
		cors: {
			origin: '*',
		},
	});

	const esbuildServerUrl = `http://localhost:${serveResult.port}`;

	console.log(`[ESBuild Builder] Dev server started at ${esbuildServerUrl}`);

	router.get('/iframe.html', async (_req, res) => {
		const html = await generateIframeHtml(options, esbuildServerUrl);
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
