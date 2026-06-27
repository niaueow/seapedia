import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,         // strip out any fields we didn't ask for
      forbidNonWhitelisted: true, // reject requests that include unexpected fields
      transform: true,         // auto-convert JSON into our DTO classes
    }),
  );

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();