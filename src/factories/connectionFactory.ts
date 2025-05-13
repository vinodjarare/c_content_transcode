// lib/redis.ts
import IORedis, { Redis, RedisOptions } from "ioredis";
import { Config } from "../config";


const redisOptions: RedisOptions = {
  host: Config.REDIS_HOST,
  port: Number(Config.REDIS_PORT),
  tls: Config.REDIS_TLS === "true" ? {} : undefined,
  retryStrategy: (times) => Math.min(times * 1000, 30000),
  maxRetriesPerRequest: null,
};

let connection: Redis | null = null;

export const createRedisConnection = (): Redis => {
  if (!connection) {
    connection = new IORedis(redisOptions);
    connection.on("error", (err) => console.error("Redis Error:", err));
    connection.on("connect", () => console.log("Connected to Redis"));
    connection.on("close", () => console.log("Redis connection closed"));
  }
  return connection;
};
