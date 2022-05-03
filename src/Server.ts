import express, { Request, Response, Express } from 'express';
import compression from 'compression';
import { DataSource } from 'typeorm';
import https from 'https';
import http from 'http';
import path from 'path';
import cors from 'cors';

import {
	ServerConfigurationExtension,
	ServerConfiguration,
	getConfiguration,
} from './config';
import { Compatibility, SourceType, CardType } from './model';
import { setConfiguration } from './config/Configuration';
import { registeredParsers } from './parser';
import { getLogger } from './util';

/**
 * Creates a new server of a TRPUX server with set configuration.
 * The server starts immediately listening at the configured port.
 *
 * @param configuration 	Server Configuration to be used
 *
 * @returns 				HTTP(S) server instance running a TRPUX server with the set configuration
 */
export async function createServer(
	configuration?: ServerConfigurationExtension
): Promise<http.Server | https.Server> {
	try {
		const serverConfiguration = handleConfiguration(configuration ?? {});

		if (!serverConfiguration) {
			throw new Error('Could not initialize server configuration!');
		}

		const log = getLogger('Server Initialization');
		log.info('Initializing server.');

		log.debug('Initializing passport.');
		log.debug('Passport has been initialized.');

		log.debug('Initializing database.');
		const AppDataSource = new DataSource(
			serverConfiguration.getDatabaseConfiguration()
		);
		await AppDataSource.initialize();
		log.debug('Database has been initialized.');

		log.debug('Initializing default database values.');
		await registerDefaultDatabaseValues(serverConfiguration);
		log.debug('Default database values initialized.');

		const app = await createInstance(configuration);

		log.debug('Initializing server instance.');
		let server: http.Server | https.Server;

		const certificate = serverConfiguration.getSSLCertificate();
		if (certificate) {
			server = https.createServer(
				{ key: certificate.key, cert: certificate.cert },
				app
			);
			log.debug('HTTPS server has been initialized.');
		} else {
			server = http.createServer(app);
			log.debug('HTTP server has been initialized.');
		}

		server.listen(serverConfiguration.getPort());
		log.info(
			`Server is listening on http${
				certificate ? 's' : ''
			}://localhost:${serverConfiguration.getPort()}`
		);

		return server;
	} catch (err) {
		// Using console here as configuration for logging may not be initialized.
		// Plus direct output to console is much more helpful at the start.
		console.error('Could not create new TRPUX server!');
		throw err;
	}
}

/**
 * Creates a new Express instance of TRPUX with set configuration.
 * The instance is not started and has to be served afterwards manually.
 *
 * @param configuration 	Server configuration
 *
 * @returns 				New Express instance of TRPUX
 */
export async function createInstance(
	configuration?: ServerConfigurationExtension
): Promise<Express> {
	try {
		const serverConfiguration = handleConfiguration(configuration ?? {});

		const log = getLogger('Instance');

		log.debug('Initializing Express Instance');
		const app = express();

		log.debug('Initializing Express middleware.');
		app.use(express.urlencoded({ extended: true }));
		app.use(express.json());
		app.use(compression());
		app.use(cors({ credentials: true }));
		log.debug('Express middleware hase been initialized.');

		log.debug('Initializing API routes.');
		const { routers } = await import('./router');
		for (const router of routers) {
			app.use(serverConfiguration.getPrefix(), router);
		}
		log.debug('API routes have been initialized.');

		log.debug('Initializing static content.');
		const staticPath = serverConfiguration.getStaticPath();

		if (staticPath) {
			app.use(express.static(staticPath));
			app.get('/*', (_req: Request, res: Response) =>
				res.sendFile(path.join(staticPath, 'index.html'))
			);

			log.debug('Static content has been initialized.');
		} else {
			log.debug('No static path has been set. Skipping static initialization.');
		}

		return app;
	} catch (err) {
		// Using console here as configuration for logging may not be initialized.
		// Plus direct output to console is much more helpful at the start.
		console.error('Could not create new instance of TRPUX!');
		throw err;
	}
}

/**
 * Handles retrieval of server configuration when it is not certain,
 * if the configuration has been set previously.
 *
 * @param configuration 	Current server configuration
 *
 * @returns 				Sets configuration , if not set previously, and returns it
 */
function handleConfiguration(
	configuration: ServerConfigurationExtension
): ServerConfiguration {
	let serverConfiguration: ServerConfiguration | undefined = getConfiguration();

	if (!serverConfiguration) {
		serverConfiguration = setConfiguration(configuration ?? {});
	}

	return serverConfiguration;
}

/**
 * Registers default database values if they do not exist already.
 */
async function registerDefaultDatabaseValues(
	configuration: ServerConfiguration
): Promise<void> {
	const defaultTypes = [
		{ name: 'Line Graph', aggregated: true },
		{ name: 'Matrix', aggregated: false },
		{ name: 'Iframe', aggregated: false },
		{ name: 'Single Value', aggregated: true },
	];

	for (const defaultType of defaultTypes) {
		const cardTypes = await CardType.find();

		if (!cardTypes.find((t) => t.name === defaultType.name)) {
			const newType = new CardType();
			newType.name = defaultType.name;
			newType.canBeAggregated = defaultType.aggregated;
			await newType.save();
		}
	}

	for (const parser of registeredParsers) {
		let sourceTypes = await SourceType.find();
		let cardTypes = await CardType.find();
		let compatibility = await Compatibility.find();

		for (const type of parser.supportedCards) {
			if (!cardTypes.find((t) => t.name === type.name)) {
				const newType = new CardType();
				newType.name = type.name;
				newType.canBeAggregated = type.aggregated;
				await newType.save();
			}
		}
		cardTypes = await CardType.find();

		for (const type of parser.supportedSources) {
			if (!sourceTypes.find((t) => t.name === type)) {
				const newType = new SourceType();
				newType.name = type;
				await newType.save();
			}
		}
		sourceTypes = await SourceType.find();

		for (const comp of parser.supportedTypesMap) {
			let newComp = compatibility.find(
				(c) => c.cardType.name === comp.cardType
			);

			if (!newComp) {
				newComp = new Compatibility();
				newComp.cardType = cardTypes.find(
					(c) => c.name === comp.cardType
				) as CardType;
				newComp.sourceTypes = [];
			}

			for (const sourceType of comp.sourceTypes) {
				newComp.sourceTypes.push(
					sourceTypes.find((t) => t.name === sourceType) as SourceType
				);
			}

			newComp.sourceTypes = [...new Set(newComp.sourceTypes)];

			await newComp.save();
		}
	}
}
