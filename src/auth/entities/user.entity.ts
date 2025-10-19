import { Column, Entity, JoinColumn, ManyToOne, OneToOne, PrimaryGeneratedColumn } from "typeorm";
import { Role } from "./role.entity";
import { Donor } from "../../donations/entities/donor.entity";
import { HealthEntity } from "../../donations/entities/health-entity.entity";

@Entity('users')
export class User {

    @PrimaryGeneratedColumn()
    id:number;

    @Column({unique: true})
    email: string;

    @Column({ select: false })
    password: string;

    @ManyToOne(() => Role, (role) => role.users,{ eager: true })
    @JoinColumn({name: 'role_id'})
    role: Role;

    @OneToOne(() => Donor, (donor)=> donor.user)
    donor: Donor;

    @OneToOne(() => HealthEntity, (healthEntity) => healthEntity.user)
    healthEntity: HealthEntity;
}
