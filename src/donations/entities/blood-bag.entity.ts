import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Blood } from "./blood.entity";
import { Request } from "./request.entity";
import { Donor } from "./donor.entity";

@Entity('blood-bags')
export class BloodBag {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    quantity: number;

    @CreateDateColumn()
    donationDate: Date;

    @CreateDateColumn()
    expirationDate: Date;

    @ManyToOne(() => Request, (request) => request.bloodBags, { eager: true })
    @JoinColumn({ name: 'request_id' })
    request: Request;

    @ManyToOne(() => Blood, (blood) => blood.bloodBags, { eager:true })
    @JoinColumn({ name: 'blood_id' }) 
    blood: Blood;


    @ManyToOne(() => Donor, (donor) => donor.bloodBags, { eager: true })
    @JoinColumn({ name: 'donor_id' })
    donor: Donor;

}