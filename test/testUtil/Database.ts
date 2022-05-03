import { DataSource, DataSourceOptions } from 'typeorm';

import { testConfiguration } from './Configuration';
import { CardType, Server, Source, SourceType } from '../../src/model';

/**
 * Populates database with default test data.
 */
export async function populateTestDatabase(): Promise<void> {
	await clearTables();

	const servers = await createServers();
	const sourceTypes = await createSourceTypes();
	const _sources = await createSources(servers, sourceTypes);
	const _cardTypes = await createCardTypes();
}

/**
 * Clears every table in the database.
 */
async function clearTables(): Promise<void> {
	const connection = new DataSource(
		testConfiguration.database as DataSourceOptions
	);
	await connection.initialize();

	for (const entity of connection.entityMetadatas) {
		try {
			const repository = connection.getRepository(entity.name);
			await repository.query(`DELETE FROM ${entity.tableName};`);
			await repository.query('DELETE FROM sqlite_sequence;');
		} catch (_err) {}
	}
}

/**
 * Creates the default test servers
 *
 * @returns Default test servers
 */
async function createServers(): Promise<Server[]> {
	const jenkins = new Server();
	jenkins.id = 1;
	jenkins.name = 'Jenkins';
	jenkins.type = 'jenkins';
	jenkins.url = 'https://jenkins.test/';
	await jenkins.save();

	return Server.find();
}

/**
 * Creates the default source types
 *
 * @returns Default test source types
 */
async function createSourceTypes(): Promise<SourceType[]> {
	const jenkins = new SourceType();
	jenkins.id = 1;
	jenkins.name = 'jenkins-matrix';
	await jenkins.save();

	const jenkinsMakefile = new SourceType();
	jenkinsMakefile.id = 2;
	jenkinsMakefile.name = 'jenkins-makefile';
	await jenkinsMakefile.save();

	return SourceType.find();
}

/**
 * Creates the default test sources
 *
 * @param servers	Default test servers
 * @param types 	Default test source types
 *
 * @returns 		Default test sources
 */
async function createSources(
	servers: Server[],
	types: SourceType[]
): Promise<Source[]> {
	const jenkinsMakefile = new Source();
	jenkinsMakefile.id = 1;
	jenkinsMakefile.name = 'Jenkins Makefile';
	jenkinsMakefile.address = 'https://jenkins.test/makefile/';
	jenkinsMakefile.server = servers.find(
		(server) => server.name === 'Jenkins'
	) as Server;
	jenkinsMakefile.type = types.find(
		(type) => type.name === 'jenkins-makefile'
	) as SourceType;
	await jenkinsMakefile.save();

	const jenkinsMatrix = new Source();
	jenkinsMatrix.id = 2;
	jenkinsMatrix.name = 'Jenkins Matrix';
	jenkinsMatrix.address = 'https://jenkins.test/matrix/';
	jenkinsMatrix.server = servers.find(
		(server) => server.name === 'Jenkins'
	) as Server;
	jenkinsMatrix.type = types.find(
		(type) => type.name === 'jenkins-matrix'
	) as SourceType;
	await jenkinsMatrix.save();

	const jenkinsUnreachable = new Source();
	jenkinsUnreachable.id = 3;
	jenkinsUnreachable.name = 'Jenkins Unreachable';
	jenkinsUnreachable.address = 'https://jenkins.test/unreachable/';
	jenkinsUnreachable.server = servers.find(
		(server) => server.name === 'Jenkins'
	) as Server;
	jenkinsUnreachable.type = types.find(
		(type) => type.name === 'jenkins-matrix'
	) as SourceType;
	jenkinsUnreachable.isReachable = false;
	await jenkinsUnreachable.save();

	return Source.find();
}

/**
 * Creates the default test card types
 *
 * @returns Default test card types
 */
async function createCardTypes(): Promise<CardType[]> {
	const graph = new CardType();
	graph.name = 'Line Graph';
	graph.id = 1;
	graph.canBeAggregated = true;
	await graph.save();

	const single = new CardType();
	single.name = 'Single Value';
	single.id = 2;
	single.canBeAggregated = true;
	await single.save();

	return CardType.find();
}
