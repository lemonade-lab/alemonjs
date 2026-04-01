/**
 * 获得ioredis时，自动链接
 * @module ioredis
 */
import redisClient, { Redis as RedisClient, RedisOptions } from 'ioredis';
import { getRedisConfig } from '../config';

type Config = {
  host?: string;
  port?: number;
  password?: string;
  db?: number;
};

/**
 * 获得ioredis客户端
 * @returns
 */
export const getIoRedis = (config: Config & RedisOptions = {}): RedisClient => {
  if (global.ioRedis) {
    return global.ioRedis;
  }
  const redis = getRedisConfig();
  const { host, port, password, db, ...options } = config;
  const baseConfig = {
    host: '127.0.0.1',
    port: 6379,
    password: '',
    db: 0
  };

  const connectConfig = {
    host: host ?? redis?.host ?? baseConfig.host,
    port: port ?? redis?.port ?? baseConfig.port,
    password: password ?? redis?.password ?? baseConfig.password,
    db: db ?? redis?.db ?? baseConfig.db
  };

  global.ioRedis = new redisClient({
    host: connectConfig.host,
    port: connectConfig.port,
    password: connectConfig.password,
    db: connectConfig.db,
    maxRetriesPerRequest: null,
    ...options
  });

  const persistenceBaseConfig = {
    enabled: true,
    rdb: true,
    aof: true,
    aofFsync: 'everysec' as const
  };

  // 从配置中获取持久化设置
  const persistenceConfig = {
    enabled: redis?.persistence?.enabled ?? persistenceBaseConfig.enabled,
    rdb: redis?.persistence?.rdb ?? persistenceBaseConfig.rdb,
    aof: redis?.persistence?.aof ?? persistenceBaseConfig.aof,
    aofFsync: redis?.persistence?.aofFsync ?? persistenceBaseConfig.aofFsync
  };

  // 添加事件监听来配置持久化
  global.ioRedis
    .on('connect', () => {
      logger.debug('Redis client connected');
    })
    .on('ready', async () => {
      logger.debug('Redis client ready');
      try {
        await applyPersistenceConfig(global.ioRedis, persistenceConfig);
      } catch (error) {
        logger.warn('Failed to apply persistence configuration:', error);
      }
    })
    .on('error', err => {
      logger.error('Redis client error:', err);
    })
    .on('close', () => {
      logger.debug('Redis client connection closed');
    })
    .on('reconnecting', () => {
      logger.debug('Redis client reconnecting');
    });

  return global.ioRedis;
};

/**
 * 应用持久化配置到 Redis 服务器
 */
async function applyPersistenceConfig(
  client: RedisClient,
  persistence: {
    enabled: boolean;
    rdb: boolean;
    aof: boolean;
    aofFsync: string;
  }
): Promise<void> {
  if (!persistence.enabled) {
    logger.info('Redis persistence is disabled');

    return;
  }

  try {
    // 使用大写命令
    if (persistence.rdb) {
      // 设置 RDB 保存条件
      await client.call('CONFIG', 'SET', 'save', '900 1 300 10 60 10000');
      logger.debug('RDB persistence configured');
    } else {
      await client.call('CONFIG', 'SET', 'save', '');
      logger.debug('RDB persistence disabled');
    }

    // 配置 AOF 持久化
    if (persistence.aof) {
      await client.call('CONFIG', 'SET', 'appendonly', 'yes');
      await client.call('CONFIG', 'SET', 'appendfsync', persistence.aofFsync);
      logger.debug(`AOF persistence configured with fsync: ${persistence.aofFsync}`);
    } else {
      await client.call('CONFIG', 'SET', 'appendonly', 'no');
      logger.debug('AOF persistence disabled');
    }

    logger.debug('Redis persistence configuration applied successfully');
  } catch (error) {
    logger.warn('Failed to apply persistence configuration:', error);
  }
}

/**
 * 安全关闭 Redis 连接
 */
export const closeRedis = async (): Promise<void> => {
  if (global.ioRedis) {
    try {
      // 在关闭前尝试保存数据
      await global.ioRedis.save();
      logger.debug('Redis data saved before closing');
    } catch (error) {
      logger.warn('Failed to save Redis data before closing:', error);
    }

    await global.ioRedis.quit();
    global.ioRedis = null;
    logger.debug('Redis connection closed');
  }
};

/**
 * 检查 Redis 连接状态
 */
export const checkRedisHealth = async (): Promise<boolean> => {
  try {
    if (!global.ioRedis) {
      return false;
    }
    await global.ioRedis.ping();

    return true;
  } catch (error) {
    logger.error('Redis health check failed:', error);

    return false;
  }
};

/**
 * 手动触发数据保存
 */
export const manualSave = async (): Promise<void> => {
  if (!global.ioRedis) {
    throw new Error('Redis client not initialized');
  }

  try {
    await global.ioRedis.bgsave();
    logger.debug('Manual background save triggered');
  } catch (error) {
    logger.error('Manual background save failed:', error);
    // 降级到同步保存
    await global.ioRedis.save();
    logger.debug('Manual save completed (sync)');
  }
};

// 进程退出时的清理处理
if (typeof process !== 'undefined' && process.on) {
  const cleanup = async () => {
    logger.info('Shutting down Redis connection...');
    await closeRedis().catch(err => {
      logger.error('Error closing Redis on exit:', err);
    });
  };

  process.on('exit', () => {
    cleanup().catch(err => logger.error('Error closing Redis on exit:', err));
  });
  process.on('SIGINT', () => {
    cleanup().catch(err => logger.error('Error closing Redis on SIGINT:', err));
  }); // Ctrl+C
  process.on('SIGTERM', () => {
    cleanup().catch(err => logger.error('Error closing Redis on SIGTERM:', err));
  }); // 终止信号
  process.on('uncaughtException', () => {
    cleanup().catch(err => logger.error('Error closing Redis on uncaughtException:', err));
  });
}
