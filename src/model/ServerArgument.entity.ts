import {
	BaseEntity,
	Column,
	Entity,
	ManyToOne,
	PrimaryGeneratedColumn,
} from 'typeorm';

import { Server } from './Server.entity';

/**
 * Represents an additional server argument used by data parsers.
 * For example access token for TeamCity
 */
@Entity()
export class ServerArgument extends BaseEntity {
	@PrimaryGeneratedColumn()
	id: number;

	@Column()
	key: string;

	@Column()
	value: string;

	@ManyToOne(() => Server, (server) => server.arguments, {
		onDelete: 'CASCADE',
	})
	server: Server;
}
