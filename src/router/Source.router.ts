import { Request, Response, Router } from 'express';

import { getSourceService } from '../service/Source.service';
import { Compatibility, Server, Source } from '../model';
import { getLogger } from '../util';

const router = Router();

/**
 * Sends the list of available sources and servers
 * as parsing servers from sources can be resource intensive for higher number of sources
 */
router.get('/source', async (req: Request, res: Response) => {
	const log = getLogger('Source Router [GET /source]');

	log.info(`Sending the list of sources to ${req.ip}`);

	try {
		const servers = await Server.find();
		const sources = await Source.find();
		const compatibilities = await Compatibility.find();

		res.json({
			servers: servers,
			sources: sources,
			compatibilities: compatibilities,
		});
	} catch (err) {
		log.error('Could not load the list of sources');
		log.error(err as Error);
		log.debug({ req });

		res.status(500).send((err as Error).message);
	}
});

/**
 * Refreshes the list of available sources and sends the new list back
 */
router.get('/source/refresh', async (req: Request, res: Response) => {
	const log = getLogger('Source Router [GET /source/refresh]');

	log.info(`Refreshing sources on behalf of ${req.ip}`);

	try {
		const service = getSourceService();
		await service.refreshSource();

		const servers = await Server.find();
		const sources = await Source.find();

		res.json({ servers: servers, sources: sources });
	} catch (err) {
		log.error('Could not refresh sources');
		log.error(err as Error);
		log.debug({ req });

		res.status(500).send((err as Error).message);
	}
});

/**
 * Loads all available card options for a selected source
 */
router.get('/source/:id/options', async (req: Request, res: Response) => {
	const log = getLogger('Source Router [GET /source/:id/options]');

	log.info(`Sending the options of source ${req.params.id} to ${req.ip}`);

	try {
		const source = await Source.findOne({
			where: { id: Number(req.params.id) },
		});
		const service = getSourceService();

		if (!source) {
			throw new Error(`Source with the ID ${req.params.id} does not exist!`);
		}

		const options = await service.getOptions(source);

		res.json(options);
	} catch (err) {
		log.error(`Could not load options of the source ${req.params.id}`);
		log.error(err as Error);
		log.debug({ req });

		res.status(500).send((err as Error).message);
	}
});

export { router };
