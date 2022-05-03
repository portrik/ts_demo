import {
	BaseEntity,
	Entity,
	OneToOne,
	PrimaryGeneratedColumn,
	JoinColumn,
	ManyToMany,
	JoinTable,
} from 'typeorm';

import { SourceType } from './SourceType.entity';
import { CardType } from './CardType.entity';

@Entity()
export class Compatibility extends BaseEntity {
	@PrimaryGeneratedColumn()
	id: number;

	@ManyToMany(
		() => SourceType,
		(sourceType) => sourceType.compatibleCardTypes,
		{ cascade: true, eager: true }
	)
	@JoinTable()
	sourceTypes: SourceType[];

	@OneToOne(() => CardType, { eager: true })
	@JoinColumn()
	cardType: CardType;
}
