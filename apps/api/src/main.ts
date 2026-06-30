import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  console.log('WEB_ORIGIN =', JSON.stringify(process.env.WEB_ORIGIN));
  // Allow the Next.js web app to call this API from the browser.
  // Origins come from WEB_ORIGIN (comma-separated) so production hosts are
  // configured per-environment; localhost:3001 is always allowed for local dev.
  const allowedOrigins = (process.env.WEB_ORIGIN ?? '')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);
  if (!allowedOrigins.includes('http://localhost:3001')) {
    allowedOrigins.push('http://localhost:3001');
  }
  app.enableCors({ origin: allowedOrigins, credentials: true });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
