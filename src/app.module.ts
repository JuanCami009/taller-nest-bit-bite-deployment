import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { DonationsModule } from './donations/donations.module';
import { ReportsModule } from './reports/reports.module';

type SupportedDbTypes =
    | 'mysql'
    | 'postgres'
    | 'sqlite'
    | 'mariadb'
    | 'mongodb'
    | 'oracle';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }),
            TypeOrmModule.forRootAsync({
              imports: [ConfigModule],
              inject: [ConfigService],
              useFactory: (configService: ConfigService) => ({
                  type: configService.get<SupportedDbTypes>('DB_TYPE') ?? 'mysql',
                  host: configService.get<string>('DB_HOST') ?? 'localhost',
                  port: configService.get<number>('DB_PORT') ?? 5432,
                  username: configService.get<string>('DB_USERNAME') ?? 'root',
                  password: configService.get<string>('DB_PASSWORD') ?? 'root',
                  database: configService.get<string>('DB_DATABASE') ?? 'test',
                  entities: [__dirname + '/**/*.entity{.ts,.js}'],
                  synchronize:
                      configService.get<boolean>('DB_SYNCHRONIZE') ?? false,
              }),
          }),
        AuthModule,
        DonationsModule,
        ReportsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
