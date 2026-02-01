import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { Logger } from 'nestjs-pino';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filter';

const trackMemoryMetrics = (logger: Logger) =>
  setInterval(() => {
    const memory = process.memoryUsage();
    const totalProcessMemory = `${(memory.rss / 1024 / 1024).toFixed(2)} MB`;
    const heapUsed = `${(memory.heapUsed / 1024 / 1024).toFixed(2)} MB`;

    logger.log(`Total process memory: ${totalProcessMemory}`);
    logger.log(`Heap used: ${heapUsed}`);
  }, 1000);

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalFilters(new HttpExceptionFilter());

  const logger = app.get(Logger);
  const configService = app.get(ConfigService);
  const port = configService.get<number>('APP_PORT', 3000);

  const metricsEnabled = configService.get<string>('METRICS_ENABLED', '0');
  if (metricsEnabled === '1') {
    trackMemoryMetrics(logger);
  }

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
