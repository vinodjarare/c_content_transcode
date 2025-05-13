import { config } from "dotenv";

config();

const {
  PORT,
  NODE_ENV,
  KAFKA_BROKER,
  REDIS_PORT,
  REDIS_HOST,
  REDIS_PASSWORD,
  REDIS_TLS,
} = process.env;

export const Config = {
  PORT,
  NODE_ENV,
  KAFKA_BROKER,
  REDIS_PORT,
  REDIS_HOST,
  REDIS_PASSWORD,
  REDIS_TLS,
};
