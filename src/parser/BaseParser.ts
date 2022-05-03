import pino from 'pino';

import { CardTypeMap, Options } from '../cards';
import { Server, ServerArgument, Source } from '../model';

export interface BaseParser {
	/**
	 * List of all supported server types.
	 */
	supportedServers: string[];

	/**
	 * List of all supported source types.
	 */
	supportedSources: string[];

	/**
	 * List of all supported card types.
	 */
	supportedCards: { name: string; aggregated: boolean }[];

	/**
	 * Map of supported types of cards and sources.
	 */
	supportedTypesMap: { cardType: string; sourceTypes: string[] }[];

	/**
	 * Optional setter for logging through the server logger.
	 */
	setLogger?: (pino: pino.Logger) => void;

	/**
	 * Loads all available sources on a selected server.
	 *
	 * @param server    Server to load sources from
	 * @param args      Arguments for server access (authentication tokens, sub-paths...)
	 *
	 * @returns         List of all sources loadable by the parser
	 */
	getAll: (server: Server, args: ServerArgument[]) => Promise<Source[]>;

	/**
	 * Loads all necessary source data for a requested card.
	 *
	 * @param type      Type of the card
	 * @param source    Source to load data from
	 * @param args      Arguments for source loading (branches, time spans...)
	 *
	 * @returns         Card data from requested source
	 */
	getSource: <T extends keyof CardTypeMap>(
		type: T,
		source: Source
	) => Promise<CardTypeMap[T]>;

	/**
	 * Loads all options for a source available in the parser.
	 *
	 * @param source    Source to load options for
	 *
	 * @returns         All available options for the selected source
	 */
	getOptions: (source: Source) => Promise<Options.Options>;
}

/**
 * Custom type guard for BaseParser.
 *
 * @params tested   Object to be tested
 *
 * @returns         Is the object of the BaseParser type?
 */
export function isParser(tested: unknown): tested is BaseParser {
	const converted = tested as BaseParser;

	return (
		converted &&
		converted.getSource !== undefined &&
		converted.getAll !== undefined &&
		converted.getOptions !== undefined &&
		converted.supportedServers !== undefined &&
		converted.supportedCards !== undefined &&
		converted.supportedSources !== undefined
	);
}

/**
 * List of all properly declared parsers.
 */
export const registeredParsers: BaseParser[] = [];

export function Parser(): ClassDecorator {
	return function (Class) {
		try {
			// Quite a mouthful but it is the only way to prevent typing errors.
			// Since the decorator can be used on classes, function, and attributes, retype to unknown
			// has to be made before retyping to a class constructor with unknown class type.
			// Thus making sure that Class is really a class before going to isParser type guard.
			const possibleParser = new (Class as unknown as new () => unknown)();

			if (!isParser(possibleParser)) {
				throw new Error(
					'Parser did not pass the isParser type check! Maybe it does not extend the BaseParser class?'
				);
			}

			registeredParsers.push(possibleParser);
		} catch (err) {
			// Using console.error here as the logging configuration is not set
			// during ClassDecorator calls. It also serves as a faster warning during development.
			console.error('Found an incompatible Parser!');
			console.error(Class);
			console.error(err);
		}
	};
}
