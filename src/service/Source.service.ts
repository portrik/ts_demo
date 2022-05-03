import P from 'pino';

import { CardTypeMap, Options } from '../cards';

import { Server, ServerArgument, Source } from '../model';
import { registeredParsers, BaseParser } from '../parser';
import { getLogger } from '../util';

let log: P.Logger;

class SourceService {
	private parsers: BaseParser[] = [];

	constructor() {
		log = getLogger('Source Service');

		for (const parser of registeredParsers) {
			if (parser.setLogger) {
				parser.setLogger(log);
			}

			this.parsers.push(parser);
		}
	}

	async getSourceData<T extends keyof CardTypeMap>(
		sources: Source[],
		type: T
	): Promise<CardTypeMap[T][]> {
		const data: CardTypeMap[T][] = [];

		for (const source of sources) {
			let loadedSource;

			for (const parser of this.parsers) {
				if (
					parser.supportedTypesMap.find(
						(t) =>
							t.cardType === type &&
							t.sourceTypes.find((s) => s === source.type.name)
					)
				) {
					loadedSource = await parser.getSource(type, source);
				}
			}

			if (!loadedSource) {
				throw new Error(
					`Source type "${source.type.name}" is not supported for card "${type}"!`
				);
			}

			data.push(loadedSource);
		}

		return data;
	}

	/**
	 * Refreshes the list of all available sources.
	 * Sources are loaded, duplicates filtered out and new sources are saved to the database.
	 */
	async refreshSource(): Promise<void> {
		const servers = await Server.find();
		const currentSources = await Source.find();

		for (const server of servers) {
			try {
				// Finds relevant parser to load sources from
				const parser = this.parsers.find((p) =>
					p.supportedServers.includes(server.type)
				);

				if (!parser) {
					throw new Error(
						`There are no available parsers to retrieve data from server of type ${server.type}`
					);
				}

				// Loads additional server arguments
				const serverArgs = await ServerArgument.find({
					where: { server: { id: server.id } },
				});

				// Loads all sources available on the server
				// and then filters out already known sources
				const sources = (await parser.getAll(server, serverArgs)).filter(
					(source: Source) =>
						!currentSources.find(
							(s) =>
								s.address === source.address && s.server.id === source.server.id
						)
				);

				// Saves all of the new sources
				for (const source of sources) {
					await source.save();
				}
			} catch (err) {
				log.error(`Could not load sources of server ${server.name}`);
				log.error(err as Error);
				log.debug({ server });
			}
		}
	}

	/**
	 * Loads all available card options for a source
	 *
	 * @param source 	Source to load card options for
	 *
	 * @returns 		Card options for the selected source
	 */
	async getOptions(source: Source): Promise<Options.Options> {
		for (const parser of this.parsers) {
			if (parser.supportedSources.includes(source.type.name)) {
				return parser.getOptions(source);
			}
		}

		throw new Error(`Source type "${source.type.name}" is not supported!`);
	}
}

// Singleton is being used to avoid collisions with refresh
let sourceService: SourceService;
export function getSourceService(): SourceService {
	if (!sourceService) {
		sourceService = new SourceService();
	}

	return sourceService;
}
