import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { Donor } from "./donor.entity";
import { BloodBag } from "./blood-bag.entity";
import { Request } from "./request.entity";


export enum Type {
    A = 'A',
    B = 'B', 
    AB = 'AB',
    O = 'O'
}

export enum Rh {
    NEGATIVE = '-',
    POSITIVE = '+',
}

@Entity('bloods')
export class Blood{

    @PrimaryGeneratedColumn()
    id: number;

    @Column({ enum: Type })
    type: Type;

    @Column({ enum: Rh })
    rh: Rh;

    @OneToMany(() => Donor, (donor) => donor.blood)
    donors: Donor[];

    @OneToMany(() => BloodBag, (bloodBag) => bloodBag.blood)
    bloodBags: BloodBag[];

    @OneToMany(()=> Request, (request)=> request.blood)
    requests: Request[];
}