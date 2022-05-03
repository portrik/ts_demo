import { DataSourceOptions, EntitySchema } from 'typeorm';
import { LevelWithSilent } from 'pino';

import {
	Compatibility,
	Server,
	ServerArgument,
	Source,
	SourceType,
} from '../model';
import {
	ServerConfigurationExtension,
	SSLCertificate,
} from './UserConfiguration';

/**
 * Class containing all of the necessary TRPUX server configuration.
 * It is initialized at startup into a singleton instance and should not change
 * for the lifetime of the instance.
 */
export class ServerConfiguration {
	/**
	 * Port to listen on.
	 */
	private port = 8080;

	/**
	 * Prefix of the API.
	 *
	 * By default: /api/
	 */
	private prefix = '/api/';

	/**
	 * TypeORM configuration
	 */
	private database: DataSourceOptions = {
		type: 'sqlite',
		database: ':memory:',
		entities: [Compatibility, Server, ServerArgument, Source, SourceType],
		synchronize: true,
	};

	/**
	 * SSL certificate keys. If not set, HTTPS is not enabled.
	 */
	private certificate?: SSLCertificate;

	/**
	 * Directory to write log files to.
	 * If not set, logging to files is disabled.
	 *
	 * By default: undefined
	 */
	private logPath?: string;

	/**
	 * Lowest logging level to log.
	 *
	 * By default: debug
	 */
	private logLevel: LevelWithSilent = 'debug';

	/**
	 * Should logs be written to console?
	 *
	 * By default: false
	 */
	private logConsole = false;

	/**
	 * Directory with static files to be served by the server/
	 */
	private staticFilesPath?: string;

	constructor(userConfig: ServerConfigurationExtension) {
		if (userConfig.port) {
			this.port = userConfig.port;
		}

		if (userConfig.prefix) {
			this.prefix = userConfig.prefix;
		}

		if (userConfig.database) {
			this.database = {
				...this.database,
				...userConfig.database,
			} as DataSourceOptions;
		}

		if (userConfig.additionalEntities && this.database.entities) {
			for (const entity of userConfig.additionalEntities as EntitySchema<any>[]) {
				(this.database.entities as EntitySchema<any>[]).push(entity);
			}
		}

		if (userConfig.security) {
			this.certificate = userConfig.security.certificate;
		}

		if (userConfig.logging) {
			this.logPath = userConfig.logging.logPath;
			this.logConsole = !!userConfig.logging.console;

			if (userConfig.logging.level) {
				this.logLevel = userConfig.logging.level;
			}
		}

		this.staticFilesPath = userConfig.staticFilesPath;
	}

	getPort(): number {
		return this.port;
	}

	getPrefix(): string {
		return this.prefix;
	}

	getDatabaseConfiguration(): DataSourceOptions {
		return this.database;
	}

	getSSLCertificate(): SSLCertificate | undefined {
		return this.certificate;
	}

	getLogPath(): string | undefined {
		return this.logPath;
	}

	getLogLevel(): LevelWithSilent {
		return this.logLevel;
	}

	getConsoleLogging(): boolean {
		return this.logConsole;
	}

	getStaticPath(): string | undefined {
		return this.staticFilesPath;
	}
}

let configuration: ServerConfiguration;
/**
 * Sets the server configuration singleton.
 * Is not exported globally as it should be set only by the createInstance function.
 *
 * @param config	Server Configuration to be saved
 *
 * @returns 		Saved server configuration
 */
export function setConfiguration(
	config: ServerConfigurationExtension
): ServerConfiguration {
	configuration = new ServerConfiguration(config);
	return configuration;
}

/**
 * Retrieves the current server configuration.
 * If configuration is not set, undefined is returned.
 *
 * @returns Current server configuration
 */
export function getConfiguration(): ServerConfiguration | undefined {
	return configuration;
}
