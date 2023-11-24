import { createClient } from 'redis';
import env from './env';

class RedisClient {
  client = createClient({
    url: env.REDIS_URL
  });
  constructor() {
    console.log(env.REDIS_URL);
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

  async updateUserCacheTime(key: string, user: string) {
    try {
      await this.client.executeIsolated(async (isolatedClient) => {
        const multi = isolatedClient.multi();
        await isolatedClient.watch(key);
        multi.set(
          key,
          user,
          { XX: true, EX: 1 * 24 * 60 * 60 }
        );
  
        await multi.exec();
      });
    } catch (error) {
      console.log(error);
    }
  }
}

const redisClient = new RedisClient();

export default redisClient;
