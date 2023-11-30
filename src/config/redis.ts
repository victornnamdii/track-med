import { createClient } from 'redis';
import env from './env';
import User from '../models/User';

class RedisClient {
  client = createClient({
    url: env.REDIS_URL
  });
  constructor() {
    this.client.connect();
    this.client.on('connect', () => {
      console.log('Redis connected');
    });

    this.client.on('error', (err) => {
      console.log(err);
      process.exit(1);
    });
  }

  async get(key: string) {
    return await this.client.get(key);
  }

  async set(key: string, value: string, duration: number) {
    await this.client.set(key, value, {
      EX: duration
    });
  }

  async update(key: string, value: string) {
    await this.client.set(key, value, {
      XX: true,
      KEEPTTL: true
    });
  }

  async del(key: string) {
    await this.client.del(key);
  }

  async deleteAllUserCache(userId: string) {
    try {
      await this.client.executeIsolated(async (isolatedClient) => {
        let cursor = 1;
        while(cursor !== 0) {
          cursor -= 1;
          const scanResult = await isolatedClient.scan(
            cursor,
            {
              TYPE: 'string',
              MATCH: `trackmed_user_${userId}*`,
              COUNT: 1000000
            }
          );

          const { keys } = scanResult;
          if (keys.length > 0) {
            await isolatedClient.del(keys);
          }
  
          cursor = scanResult.cursor === 0 
            ? scanResult.cursor : scanResult.cursor + 1;
        }
      });
    } catch (error) {
      console.log(error);
    }
  }

  async updateAllUserCache(userId: string, updatedUser: User, skip: string) {
    try {
      await this.client.executeIsolated(async (isolatedClient) => {
        const scanIterator = isolatedClient.scanIterator({
          TYPE: 'string',
          MATCH: `trackmed_user_${userId}*`,
          COUNT: 1000000
        });
  
        for await (const key of scanIterator) {
          if (skip !== key) {
            await isolatedClient.set(
              key,
              JSON.stringify(updatedUser),
              { XX: true, KEEPTTL: true }
            );
          }
        }
      });
    } catch (error) {
      console.log(error);
    }
  }
}

const redisClient = new RedisClient();

export default redisClient;
