import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

// 인증이 필요 없는 API 경로 목록
const PUBLIC_APIS = [
  '/api/auth',          // 인증 관련 API
  '/api/format/basic',  // 기본 포맷팅 API
];

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  
  // API 요청이 아니거나, public API인 경우 체크하지 않음
  if (!path.startsWith('/api/') || PUBLIC_APIS.some(api => path.startsWith(api))) {
    console.log('🔓 인증 불필요:', path);
    return NextResponse.next();
  }
  
  console.log('\n[API 인증 체크] =====================');
  console.log('요청 경로:', path);
  
  try {
    const token = await getToken({ 
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
      secureCookie: process.env.NODE_ENV === 'production',
      cookieName: 'next-auth.session-token'
    });
    
    console.log('토큰 상태:', token);
    
    if (!token?.email) {
      console.log('❌ 인증 실패: 로그인되지 않은 요청', token);
      return NextResponse.json(
        { error: '인증이 필요한 기능입니다. 로그인해주세요.' },
        { status: 401 }
      );
    }
    
    console.log('✅ 인증 성공:', {
      email: token.email,
      sessionToken: token.jti
    });
    
    // 요청 헤더에 사용자 정보 추가
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-user-email', token.email);
    requestHeaders.set('x-session-token', token.jti as string);
    
    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
    
  } catch (error) {
    console.error('❌ 인증 체크 실패:', error);
    return NextResponse.json(
      { error: '인증 처리 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// 미들웨어가 적용될 경로 설정
export const config = {
  matcher: [
    '/api/:path*',  // /api/ 로 시작하는 모든 경로
  ],
}; 