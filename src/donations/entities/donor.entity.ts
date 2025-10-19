import { User } from "../../auth/entities/user.entity";
import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, OneToMany, OneToOne, PrimaryGeneratedColumn } from "typeorm";
import { Blood } from "./blood.entity";
import { BloodBag } from "./blood-bag.entity";

@Entity('donors')
export class Donor{

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    document: string;

    @Column()
    name: string;

    @Column()
    lastname: string;

    @CreateDateColumn()
    birthDate: Date;

    @OneToOne(()=> User, (user)=> user.donor, { eager:true })
    @JoinColumn({ name:"user_id" })
    user: User;

    @ManyToOne(() => Blood, (blood) => blood.donors, { eager:true })
    @JoinColumn({ name:"blood_id" })
    blood: Blood;

    @OneToMany(() => BloodBag, (bloodBag) => bloodBag.donor)
    bloodBags: BloodBag[];

}