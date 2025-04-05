import { headers } from 'next/headers';

export async function getApiUser() {
  const headersList = await headers();
  
  const email = headersList.get('x-user-email');
  const sessionToken = headersList.get('x-session-token');
  
  if (!email || !sessionToken) {
    throw new Error('인증 정보가 없습니다.');
  }
  
  return {
    email,
    sessionToken,
  };
}

export async function validateApiRequest() {
  try {
    const user = await getApiUser();
    console.log('\n[API 요청 검증] =====================');
    console.log('사용자:', user.email);
    console.log('세션:', user.sessionToken);
    console.log('====================================\n');
    return true;
  } catch (error) {
    console.error('\n[API 요청 검증 실패] =====================');
    console.error('에러:', error);
    console.log('====================================\n');
    return false;
  }
} 