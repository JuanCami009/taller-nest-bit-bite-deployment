import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { Blood } from "./blood.entity";
import { BloodBag } from "./blood-bag.entity";
import { HealthEntity } from "./health-entity.entity";

@Entity('requests')
export class Request{

    @PrimaryGeneratedColumn()
    id: number;

    @CreateDateColumn({ default: new Date() })
    dateCreated: Date;

    @Column()
    quantityNeeded: number;

    @CreateDateColumn()
    dueDate: Date;

    @ManyToOne(() => Blood, (blood) => blood.requests, { eager:true })
    @JoinColumn({ name: 'blood_id' })
    blood: Blood;

    @ManyToOne(() => HealthEntity, (healthEntity) => healthEntity.request,{ eager:true })
    @JoinColumn({ name: 'health-entity_id' }) 
    healthEntity: HealthEntity;

    @OneToMany(() => BloodBag, (bloodBag) => bloodBag.request)
    bloodBags: BloodBag[]
}