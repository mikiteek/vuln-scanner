import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { Logger } from 'nestjs-pino';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalFilters(new HttpExceptionFilter());

  const logger = app.get(Logger);
  const configService = app.get(ConfigService);
  const port = configService.get<number>('APP_PORT', 3000);

  await app.listen(port, () => {
    logger.log(`Server is running on port ${port} !!!!!!!!!!!!`);
  });
}

bootstrap()
  .then(() => console.log('Server started successfully.'))
  .catch((err) => {
    console.log('Server up failed, exiting process', err);
    process.exit(1);
  });
