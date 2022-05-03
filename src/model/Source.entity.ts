import {
	BaseEntity,
	Column,
	Entity,
	ManyToOne,
	PrimaryGeneratedColumn,
} from 'typeorm';

import { SourceType } from './SourceType.entity';
import { Server } from './Server.entity';

/**
 * Represents a single data source located on a server
 */
@Entity()
export class Source extends BaseEntity {
	@PrimaryGeneratedColumn()
	id: number;

	@Column()
	name: string;

	// Could be an URL or just an identifier
	@Column()
	address: string;

	@Column({ default: true })
	isReachable: boolean;

	@ManyToOne(() => SourceType, { eager: true, onDelete: 'SET NULL' })
	type: SourceType;

	@ManyToOne(() => Server, {
		eager: true,
		onUpdate: 'CASCADE',
		onDelete: 'CASCADE',
	})
	server: Server;
}
