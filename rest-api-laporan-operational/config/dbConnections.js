import dotenv from 'dotenv';

dotenv.config();

export const mysqlConnections = {
  default: {
    connectTimeout: 10000,
    waitForConnections: 10000,
    connectionLimit: 30,
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || '3306',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'root',
    database: process.env.DB_NAME || 'db',
  },
};

export const redisConnection = {
  url: process.env.REDIS_URL || 'redis://root:root@localhost:6380',
};

export const mongoConnections = {
  default: process.env.MONGO_URL || 'mongodb://localhost:27017/test',
};
