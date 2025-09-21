import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { build as esbuildBuild, context as esbuildContext } from 'esbuild';

import packageJson from '../package.json';

export * from './types';

const iframeHandler = (options, ctx2) => {
	return async (req, res) => {
		console.log('=== iframeHandler', req);
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
let ctx;
const bail = async () => {
	return ctx?.dispose();
};
const start = async (params) => {
	const { startTime, options, router, server } = params;
	console.log('=== start', params);
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
const build = async ({ options }) => {
	await esbuildBuild(options);
};
export { bail, build, start };
