
import { Column, Entity, JoinTable, ManyToMany, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { User } from "./user.entity";
import { Permission } from "./permission.entity";

@Entity('roles')
export class Role {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

    @OneToMany(() => User, (user) => user.role)
    users: User[];

    @ManyToMany(() => Permission, (permission) => permission.roles, { eager: true })
    @JoinTable()
    permissions: Permission[];


}
