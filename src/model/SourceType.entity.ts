import {
	BaseEntity,
	Column,
	Entity,
	ManyToMany,
	PrimaryGeneratedColumn,
} from 'typeorm';
import { Compatibility } from './Compatibility.entity';

@Entity()
export class SourceType extends BaseEntity {
	@PrimaryGeneratedColumn()
	id: number;

	@Column({ unique: true })
	name: string;

	@ManyToMany(() => Compatibility, (compatibility) => compatibility.sourceTypes)
	compatibleCardTypes: Compatibility[];
}
