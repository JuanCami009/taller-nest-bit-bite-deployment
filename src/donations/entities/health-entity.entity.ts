import { User } from "../../auth/entities/user.entity";
import { Column, Entity, JoinColumn, OneToMany, OneToOne, PrimaryGeneratedColumn } from "typeorm";
import { Request } from "./request.entity";

export enum InstitutionType {
    CLINIC = "clinic",
    HOSPITAL = "hospital",
    BLOODBANK = "bloodBank",
}

@Entity('healthEntities')
export class HealthEntity{

    @PrimaryGeneratedColumn()
    id: number;

    @Column({ unique: true })
    nit: string;

    @Column()
    name: string;

    @Column()
    address: string;

    @Column()
    city: string;

    @Column()
    phone: string;

    @Column()
    email: string;

    @Column({ enum: InstitutionType })
    institutionType: InstitutionType;

    @OneToOne(() => User, (user) => user.healthEntity, { eager:true })
    @JoinColumn({ name: 'user_id' })
    user: User;

    @OneToMany(() => Request, (request) => request.healthEntity)
    request:Request[];

}