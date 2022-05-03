import { createStream, Generator } from 'rotating-file-stream';
import pinoms, { Streams } from 'pino-multi-stream';
import { join } from 'path';
import P, { Logger, LoggerOptions } from 'pino';

import { getConfiguration } from '../config';

/**
 * Parent Pino logger instance.
 * Singleton is used here to direct all logging into the same streams.
 */
let logger: P.Logger;
/**
 * Creates a new Pino logger with the set name,
 *
 * @param name 	Name of the new logger
 *
 * @returns 	New Pino logger with the selected name
 */
export function getLogger(name: string): P.Logger {
	const configuration = getConfiguration();

	if (!configuration) {
		throw new Error('Configuration is not available!');
	}

	if (!logger) {
		const streams: Streams = [];

		// Creates a log stream into a file
		const logPath = configuration.getLogPath();
		if (logPath) {
			streams.push({
				stream: createStream(logNameGenerator, {
					maxSize: '10M', // Creates a new file after 10 MB is reached
					interval: '1d', // Creates a new file after 1 day since the last creation
				}),
				level: 'debug',
			});
		}

		streams.push({
			stream: pinoms.prettyStream({
				prettyPrint: {
					colorize: true, // Nice colors in the console
					translateTime: true, // Human readable time instead of UNIX timestamp
				},
			}),

			level: configuration.getConsoleLogging()
				? configuration.getLogLevel()
				: 'silent',
		});

		logger = pinoms({ streams: streams }) as unknown as Logger<LoggerOptions>;
	}

	return logger.child({ name: name });
}

/**
 * Adds leading zero for consistency
 *
 * @param num 	Number to pad with leading zero
 *
 * @returns 	String of the number with a leading zero
 */
function leadingZero(num: number): string {
	return (num > 9 ? '' : '0') + num;
}

/**
 *  Generates a new log file name from supplied time and index.
 *  Will not be called in case the config.logPath is not set -
 * 	the ?? 'log' fallback is only a placeholder and will not be used.
 *
 * @param time	Current time supplied by rfs
 *
 * @returns 	Name for the new log file
 */
const logNameGenerator: Generator = (time: Date | number) => {
	const configuration = getConfiguration();

	if (!configuration) {
		throw new Error('Configuration is not available!');
	}

	if (!time) {
		return join(configuration.getLogPath() ?? 'log', 'current.gzip');
	}

	const date: Date = typeof time === 'number' ? new Date(time) : time;
	const year = date.getFullYear();
	const month = leadingZero(date.getMonth() + 1); // Months are indexed from 0
	const day = leadingZero(date.getDate());
	const hour = leadingZero(date.getHours());
	const minute = leadingZero(date.getMinutes());

	return join(
		configuration.getLogPath() ?? 'log',
		`${year}-${month}-${day}-${hour}-${minute}.gzip`
	);
};
