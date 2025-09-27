import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import {
	type BuildContext,
	type BuildOptions,
	build as esbuildBuild,
	context as esbuildContext,
} from 'esbuild';
import type { Middleware, Options } from 'storybook/internal/types';

import packageJson from '../package.json' with { type: 'json' };
import type { EsbuildBuilder } from './types';

export type * from './types';

const iframeHandler = (_options: Options): Middleware => {
	return async (_req, res) => {
		console.log('=== iframeHandler');
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

export const start: EsbuildBuilder['start'] = async (params) => {
	const { startTime, options, router } = params;
	const { presets } = options;

	const config: BuildOptions = {
		target: 'esnext',
	};

	const finalConfig = await presets.apply('esbuildFinal', config, options);

	console.log('=== builder start finalConfig', finalConfig);
	ctx = await esbuildContext(finalConfig);

	router.get('/iframe.html', iframeHandler(options));

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
