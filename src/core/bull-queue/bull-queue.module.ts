import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { BullModule } from '@nestjs/bull';
import { RedisConfig } from '../../config/redis/redis.config';

@Module({
  imports: [
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const redisConfig = configService.get<RedisConfig>('logger');
        if (!redisConfig) {
          throw new Error('Missing redis config');
        }

        console.log(' rfedsi config - ', redisConfig);

        return {
          redis: redisConfig,
        };
      },
    }),
  ],
})
export class BullQueueModule {}
