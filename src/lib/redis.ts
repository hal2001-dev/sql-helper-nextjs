import { Redis } from 'ioredis';
import { Pool } from 'pg';
import { queries } from './sql/queries';

const DEFAULT_DAILY_LIMIT = 10000; // 기본 일일 최대 요청 토큰 사용량

let redisClient: Redis | null = null;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export async function getRedisClient(): Promise<Redis> {
  if (!redisClient) {
    redisClient = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
    redisClient.on('error', (error) => {
      console.error('Redis Client Error', error);
    });
  }
  return redisClient;
}

export async function checkTokenUsage(userId: string): Promise<{ canUse: boolean; currentUsage: number; remaining: number }> {
  const today = new Date().toISOString().split('T')[0].replace(/-/g, '');
  
  try {
    // 사용자의 일일 토큰 제한 조회
    const limitResult = await pool.query(queries.user.getTokenLimit, [userId]);
    const dailyLimit = limitResult.rows[0]?.daily_token_limit || DEFAULT_DAILY_LIMIT;
    
    // 현재 사용량 조회
    const usageResult = await pool.query(queries.tokenUsage.get, [userId, today]);
    const currentUsage = usageResult.rows[0] 
      ? usageResult.rows[0].request_tokens + usageResult.rows[0].response_tokens 
      : 0;
    
    const remaining = dailyLimit - currentUsage;
    
    console.log('Token usage check:', { 
      email: userId, 
      today, 
      currentUsage, 
      dailyLimit, 
      remaining 
    });
    
    return {
      canUse: currentUsage < dailyLimit,
      currentUsage,
      remaining,
    };
  } catch (error) {
    console.error('Error checking token usage:', error);
    return {
      canUse: false,
      currentUsage: 0,
      remaining: 0,
    };
  }
}

export async function incrementTokenUsage(userId: string, requestTokens: number, responseTokens: number): Promise<void> {
  const today = new Date().toISOString().split('T')[0].replace(/-/g, '');
  
  try {
    const result = await pool.query(queries.tokenUsage.insert, [
      userId, 
      today, 
      requestTokens || 0,
      responseTokens || 0
    ]);

    console.log('Token usage updated:', { 
      email: userId, 
      today, 
      requestTokens, 
      responseTokens,
      dbResult: result.rowCount
    });
  } catch (error) {
    console.error('Error updating token usage:', error);
    throw error;
  }
}

export async function testRedisConnection(): Promise<boolean> {
  try {
    const redis = await getRedisClient();
    await redis.ping();
    console.log('[Redis 연결 테스트] 성공');
    return true;
  } catch (error) {
    console.error('[Redis 연결 테스트] 실패:', error);
    return false;
  }
} 