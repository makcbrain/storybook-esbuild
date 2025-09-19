import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { type BuildContext, build as esbuildBuild, context as esbuildContext } from 'esbuild';
import type { Middleware, Options } from 'storybook/internal/types';

import packageJson from '../package.json';
import type { EsbuildBuilder } from './types';

export * from './types';

const iframeHandler = (options: Options, ctx: BuildContext): Middleware => {
	return async (req, res) => {
		const iframeHtml = await readFile(
			fileURLToPath(import.meta.resolve(`${packageJson.name}/assets/iframe.html`)),
			{
				encoding: 'utf8',
			},
		);

		res.setHeader('Content-Type', 'text/html');
		res.statusCode = 200;
		res.write(iframeHtml);
		res.end();
	};
};

let ctx: BuildContext;

export const bail = async (): Promise<void> => {
	return ctx?.dispose();
};

export const start: EsbuildBuilder['start'] = async ({ startTime, options, router, server }) => {
	ctx = await esbuildContext(options);

	router.get('/iframe.html', iframeHandler(options, ctx));

	return {
		bail,
		stats: {
			toJson: () => {
				return {
					message: 'no stats',
				};
			},
		},
		totalTime: process.hrtime(startTime),
	};
};

export const build: EsbuildBuilder['build'] = async ({ options }) => {
	await esbuildBuild(options);
};
