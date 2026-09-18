import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { CatalogModule } from './catalog/catalog.module';
import { ExpertsModule } from './experts/experts.module';
import { VerificationModule } from './verification/verification.module';
import { MatchingModule } from './matching/matching.module';
import { ConsultationsModule } from './consultations/consultations.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    CatalogModule,
    ExpertsModule,
    VerificationModule,
    MatchingModule,
    ConsultationsModule,
  ],
})
export class AppModule {}
