import { Request, Response, Router } from 'express';

import { Server, ServerArgument } from '../model';
import { getLogger } from '../util';

const router = Router();

router.get('/server', async (req: Request, res: Response) => {
	const log = getLogger('Server Router [GET /server]');

	log.info(`Retrieving the list of servers for ${req.ip}`);

	try {
		const servers = await Server.find();

		res.json(servers);
	} catch (err) {
		log.error('Could not retrieve the list of servers!');
		log.error(err as Error);
		log.debug({ req });

		res.status(500).send((err as Error).message);
	}
});

router.post('/server', async (req: Request, res: Response) => {
	const log = getLogger('Server Router [POST /server]');

	log.info(`Creating a new server for ${req.ip}`);

	try {
		const name = (req.body.name ?? '').trim();
		const url = new URL(req.body.url);
		const type = (req.body.type ?? '').trim();
		const disabled = req.body.disabled;
		const args = req.body.arguments;

		if (!name || name.length < 1) {
			throw new Error('Server name cannot be empty!');
		}

		if (!type || type.length < 1) {
			throw new Error('Server type cannot be empty!');
		}

		const server = new Server();
		server.name = name;
		server.url = `${url.origin}${url.pathname}`;
		server.type = type;
		server.disabled = disabled;
		server.isReachable = false;

		if (args) {
			server.arguments = [];

			for (const a in args) {
				const arg = new ServerArgument();
				arg.key = (args[a] as ServerArgument).key;
				arg.value = (args[a] as ServerArgument).value;
				server.arguments.push(arg);
			}
		}

		await server.save();

		res.json(await Server.findOne({ where: { name: server.name } }));
	} catch (err) {
		log.error('Could not create new server!');
		log.error(err as Error);
		log.debug({ req });

		res.status(500).send((err as Error).message);
	}
});

router.put('/server/:id', async (req: Request, res: Response) => {
	const log = getLogger('Server Router [PUT /server/:id]');

	const id = Number(req.params.id);

	log.info(`Updating dashboard ${id} for ${req.ip}`);

	try {
		const server = await Server.findOne({ where: { id: id } });

		if (!server) {
			throw new Error(`Server with the ID ${id} does not exist!`);
		}

		const name = (req.body.name ?? '').trim();
		const url = new URL(req.body.url);
		const type = (req.body.type ?? '').trim();
		const disabled = req.body.disabled;
		const args = req.body.arguments;

		if (!name || name.length < 1) {
			throw new Error('Server name cannot be empty!');
		}

		if (!type || type.length < 1) {
			throw new Error('Server type cannot be empty!');
		}

		server.name = name;
		server.url = `${url.origin}${url.pathname}`;
		server.type = type;
		server.disabled = disabled;

		if (args) {
			server.arguments = [];

			for (const argument in args) {
				const arg = new ServerArgument();
				arg.key = argument;
				arg.value = args[argument];
				server.arguments.push(arg);
			}
		}

		await server.save();

		res.json(await Server.findOne({ where: { id: id } }));
	} catch (err) {
		log.error(`Could not update dashboard ${id}!`);
		log.error(err as Error);
		log.debug({ req });

		res.status(500).send((err as Error).message);
	}
});

router.delete('/server/:id', async (req: Request, res: Response) => {
	const log = getLogger('Server Router [DELETE /server/:id]');

	const id = Number(req.params.id);

	log.info(`Removing server ${id} for ${req.ip}`);

	try {
		const server = await Server.findOne({ where: { id: id } });

		if (!server) {
			throw new Error(`Server with the ID ${id} does not exist!`);
		}

		await server.remove();

		res.sendStatus(200);
	} catch (err) {
		log.error(`Could not delete server ${id}!`);
		log.error(err as Error);
		log.debug({ req });

		res.status(500).send((err as Error).message);
	}
});

export { router };
