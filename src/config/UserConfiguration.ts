import { DataSourceOptions } from 'typeorm';
import { LevelWithSilent } from 'pino';

export type SSLCertificate = {
	key: string | Buffer;
	cert: string | Buffer;
};

export interface ServerConfigurationExtension {
	/**
	 * Port to listen on.
	 *
	 * By default: 8080
	 */
	port?: number;

	/**
	 * Prefix of the API.
	 *
	 * By default: /api/
	 */
	prefix?: string;

	/**
	 * TypeORM database configuration.
	 *
	 * By default: Synchronized in-memory SQLite
	 */
	database?: DataSourceOptions;

	/**
	 * Additional entities to add to the database.
	 *
	 * By default: undefined
	 */
	additionalEntities?: DataSourceOptions['entities'];

	/**
	 * Options to handle security (SSL certificate, Passport strategies...)
	 */
	security?: {
		/**
		 * SSL key and certificate needed to run HTTPS.
		 * If not set, HTTPS is disabled in favor of HTTP.
		 *
		 * By default: undefined
		 */
		certificate?: SSLCertificate;
	};

	/**
	 * Options to handle logging
	 */
	logging?: {
		/**
		 * Directory to write log files to.
		 * If not set, logging to files is disabled.
		 *
		 * By default: undefined
		 */
		logPath?: string;

		/**
		 * Lowest logging level to log.
		 *
		 * By default: debug
		 */
		level?: LevelWithSilent;

		/**
		 * Should logs be written to console?
		 *
		 * By default: false
		 */
		console?: boolean;
	};

	/**
	 * Directory to serve static files from.
	 *
	 * By default: undefined
	 */
	staticFilesPath?: string;
}
