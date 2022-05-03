import {
	BaseEntity,
	Column,
	Entity,
	OneToMany,
	PrimaryGeneratedColumn,
} from 'typeorm';

import { ServerArgument } from './ServerArgument.entity';

@Entity()
export class Server extends BaseEntity {
	@PrimaryGeneratedColumn()
	id: number;

	@Column()
	name: string;

	@Column({ unique: true })
	url: string;

	@Column()
	type: string;

	@Column({ default: true })
	isReachable: boolean;

	@Column({ default: false })
	disabled: boolean;

	@OneToMany(() => ServerArgument, (argument) => argument.server, {
		eager: true,
		cascade: true,
	})
	arguments?: ServerArgument[];
}
