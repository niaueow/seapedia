import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { StoresModule } from './stores/stores.module';
import { ProductsModule } from './products/products.module';
import { CatalogModule } from './catalog/catalog.module';
import { WalletModule } from './wallet/wallet.module';
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    StoresModule,
    ProductsModule,
    CatalogModule,
    WalletModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }