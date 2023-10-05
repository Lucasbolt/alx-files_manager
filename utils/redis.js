import { createClient } from 'redis';
// import { promisify } from 'util';

class RedisClient {
  constructor() {
    this.client = createClient();
    this.client.connect().then(() => {
      console.log('Redis is connected')
    })

    this.client.on('error', (err) => {
      console.error('Redis Error on connection', err);
    });

    // // Promisify Redis client methods
    // this.clientGetAsync = promisify(this.client.get).bind(this.client);
    // this.clientSetAsync = promisify(this.client.set).bind(this.client);
    // this.clientDelAsync = promisify(this.client.del).bind(this.client);
  }

  isAlive() {
    try {
      this.client.ping();
      return true;
    } catch (err) {
      return false;
    }
  }

  async get(key) {
    return await this.client.get(key);
  }

  async set(key, value, duration) {
    return await this.client.set(key, value, 'EX', duration);
  }

  async del(key) {
    return await this.client.del(key);
  }
}

export const redisClient = new RedisClient();
export default redisClient;
