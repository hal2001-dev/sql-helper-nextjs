import { getRedisClient, testRedisConnection } from './redis';

const SESSION_TTL = 4 * 60 * 60; // 4시간

export async function createSession(email: string, sessionToken: string | null | undefined): Promise<void> {
  console.log('\n[세션 생성 시작] =====================');
  console.log('이메일:', email);
  console.log('세션토큰:', sessionToken);
  
  if (!sessionToken) {
    console.log('❌ [실패] 세션 토큰이 없음');
    return;
  }
  
  try {
    // Redis 연결 테스트
    const isConnected = await testRedisConnection();
    if (!isConnected) {
      console.log('❌ [실패] Redis 연결 실패');
      throw new Error('Redis 연결 실패');
    }
    console.log('✅ Redis 연결 성공');

    const redis = await getRedisClient();
    
    // 기존 세션 확인 및 삭제
    const existingPattern = `session:${email}:*`;
    const existingSessions = await redis.keys(existingPattern);
    if (existingSessions.length > 0) {
      console.log('🔄 기존 세션 발견:', existingSessions);
      await redis.del(existingSessions);
      console.log('✅ 기존 세션 삭제 완료');
    }
    
    // 새로운 세션 생성
    const activeSessionKey = `session:${email}:${sessionToken}`;
    console.log('➡️ 새 세션 키:', activeSessionKey);
    
    // SET 명령어 실행
    const setResult = await redis.set(activeSessionKey, 'active');
    console.log('세션 설정 결과:', setResult);
    
    // TTL 설정
    const ttlResult = await redis.expire(activeSessionKey, SESSION_TTL);
    console.log('TTL 설정 결과:', ttlResult ? '성공' : '실패');
    
    // 최종 확인
    const createdSession = await redis.get(activeSessionKey);
    const ttl = await redis.ttl(activeSessionKey);
    console.log('✅ 세션 생성 완료');
    console.log('- 키:', activeSessionKey);
    console.log('- 값:', createdSession);
    console.log('- TTL:', ttl);
    
    // 전체 세션 목록
    const allSessions = await redis.keys('session:*');
    console.log('\n현재 활성 세션 목록:');
    allSessions.forEach(key => console.log('- ' + key));
    console.log('====================================\n');
    
  } catch (error) {
    console.error('❌ [에러] 세션 생성 실패:', error);
    throw error;
  }
}

export async function validateSession(email: string, sessionToken: string | null | undefined): Promise<boolean> {
  console.log('\n[세션 검증 시작] =====================');
  console.log('이메일:', email);
  console.log('세션토큰:', sessionToken);
  
  if (!sessionToken || !email) {
    console.log('❌ [실패] 필수 정보 누락');
    console.log('====================================\n');
    return false;
  }
  
  try {
    const redis = await getRedisClient();
    console.log('✅ Redis 연결 성공');
    
    // 현재 세션 키
    const currentSessionKey = `session:${email}:${sessionToken}`;
    console.log('➡️ 현재 세션 키:', currentSessionKey);
    
    // 세션이 존재하고 활성 상태인지 확인
    const sessionValue = await redis.get(currentSessionKey);
    const isValid = sessionValue === 'active';
    
    if (isValid) {
      console.log('✅ 세션 유효');
      
      // TTL 확인
      const ttl = await redis.ttl(currentSessionKey);
      console.log('- 남은 시간:', ttl, '초');
      
      if (ttl <= 0) {
        console.log('❌ 세션 만료됨');
        await redis.del(currentSessionKey);
        console.log('✅ 만료된 세션 삭제');
        return false;
      }
    } else {
      console.log('❌ 세션 만료 또는 없음');
      if (!sessionValue) {
        console.log('- 세션이 존재하지 않음');
      } else {
        console.log('- 세션 값이 유효하지 않음:', sessionValue);
      }
      
      // 유효하지 않은 세션 삭제
      await redis.del(currentSessionKey);
      console.log('✅ 유효하지 않은 세션 삭제');
    }
    
    console.log('\n세션 검증 결과:');
    console.log('- 이메일:', email);
    console.log('- 세션 키:', currentSessionKey);
    console.log('- 세션 값:', sessionValue);
    console.log('- 유효성:', isValid);
    console.log('====================================\n');
    
    return isValid;
  } catch (error) {
    console.error('❌ [에러] 세션 검증 실패:', error);
    console.log('====================================\n');
    return false;
  }
}

export async function removeSession(email: string): Promise<void> {
  console.log('\n[세션 삭제 시작] =====================');
  console.log('이메일:', email);
  
  try {
    const redis = await getRedisClient();
    const pattern = `session:${email}:*`;
    
    // 삭제할 세션 조회
    const sessionsToDelete = await redis.keys(pattern);
    console.log('삭제 대상 세션:', sessionsToDelete);
    
    if (sessionsToDelete.length > 0) {
      const deleteResult = await redis.del(sessionsToDelete);
      console.log('✅ 세션 삭제 완료');
      console.log('- 삭제된 세션 수:', deleteResult);
      console.log('- 삭제된 세션 키:', sessionsToDelete);
    } else {
      console.log('ℹ️ 삭제할 세션이 없음');
    }
    
    // 남은 세션 확인
    const remainingSessions = await redis.keys('session:*');
    console.log('\n남은 세션 목록:');
    remainingSessions.forEach(key => console.log('- ' + key));
    console.log('====================================\n');
    
  } catch (error) {
    console.error('❌ [에러] 세션 삭제 실패:', error);
    throw error;
  }
}

export async function removeSpecificSession(email: string, sessionToken: string): Promise<void> {
  console.log('\n[특정 세션 삭제 시작] =====================');
  console.log('이메일:', email);
  console.log('세션토큰:', sessionToken);
  
  try {
    const redis = await getRedisClient();
    const sessionKey = `session:${email}:${sessionToken}`;
    
    // 세션 삭제
    const deleteResult = await redis.del(sessionKey);
    console.log('✅ 세션 삭제 완료');
    console.log('- 삭제된 세션 키:', sessionKey);
    console.log('- 삭제 결과:', deleteResult);
    
    // 남은 세션 확인
    const remainingSessions = await redis.keys('session:*');
    console.log('\n남은 세션 목록:');
    remainingSessions.forEach(key => console.log('- ' + key));
    console.log('====================================\n');
    
  } catch (error) {
    console.error('❌ [에러] 세션 삭제 실패:', error);
    throw error;
  }
}

export async function isSessionActive(email: string): Promise<boolean> {
  const redis = await getRedisClient();
  const activeSessionKey = `session:${email}:*`;
  
  const keys = await redis.keys(activeSessionKey);
  const exists = keys.length > 0;
  
  console.log(`[세션 확인] 이메일: ${email}, 활성 세션 수: ${keys.length}`);
  return exists;
} 