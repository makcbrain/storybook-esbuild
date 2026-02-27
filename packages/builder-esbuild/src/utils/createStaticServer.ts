import { createReadStream, existsSync } from 'node:fs';
import { createServer, type IncomingMessage, type Server, type ServerResponse } from 'node:http';
import { extname, join } from 'node:path';

const CONTENT_TYPES: Record<string, string> = {
	'.js': 'application/javascript',
	'.mjs': 'application/javascript',
	'.css': 'text/css',
	'.json': 'application/json',
	'.map': 'application/json',
	'.html': 'text/html',
	'.svg': 'image/svg+xml',
	'.png': 'image/png',
	'.jpg': 'image/jpeg',
	'.woff': 'font/woff',
	'.woff2': 'font/woff2',
};

interface StaticServer {
	url: string;
	notifyReload: () => void;
	close: () => Promise<void>;
}

export const createStaticServer = (servedir: string): Promise<StaticServer> => {
	const sseClients = new Set<ServerResponse>();

	const handleSSE = (_req: IncomingMessage, res: ServerResponse): void => {
		res.writeHead(200, {
			'Content-Type': 'text/event-stream',
			'Cache-Control': 'no-cache',
			Connection: 'keep-alive',
			'Access-Control-Allow-Origin': '*',
		});

		sseClients.add(res);
		res.on('close', () => sseClients.delete(res));
	};

	const handleFile = (req: IncomingMessage, res: ServerResponse): void => {
		const url = new URL(req.url || '/', 'http://localhost');
		const filePath = join(servedir, decodeURIComponent(url.pathname));

		if (!existsSync(filePath)) {
			res.writeHead(404, { 'Access-Control-Allow-Origin': '*' });
			res.end('Not found');
			return;
		}

		const ext = extname(filePath);
		const contentType = CONTENT_TYPES[ext] || 'application/octet-stream';

		res.writeHead(200, {
			'Content-Type': contentType,
			'Access-Control-Allow-Origin': '*',
		});

		createReadStream(filePath).pipe(res);
	};

	const server: Server = createServer((req, res) => {
		if (req.url === '/esbuild') {
			handleSSE(req, res);
		} else {
			handleFile(req, res);
		}
	});

	return new Promise((resolve) => {
		server.listen(0, () => {
			const address = server.address();
			const port = typeof address === 'object' && address ? address.port : 0;

			resolve({
				url: `http://localhost:${port}`,
				notifyReload: () => {
					for (const client of sseClients) {
						client.write('event: change\ndata: {}\n\n');
					}
				},
				close: () => new Promise((res) => server.close(() => res())),
			});
		});
	});
};
