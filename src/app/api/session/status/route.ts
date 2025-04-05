import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { isSessionActive } from '@/lib/session';

export async function GET() {
  try {
    const session = await getSession();
    
    if (!session?.user?.email) {
      return NextResponse.json({ 
        isActive: false, 
        message: '로그인되지 않은 상태입니다.' 
      });
    }

    const isActive = await isSessionActive(session.user.email);
    
    return NextResponse.json({ 
      isActive,
      message: isActive ? '세션이 활성화되어 있습니다.' : '세션이 만료되었습니다.',
      email: session.user.email
    });
  } catch (error) {
    console.error('세션 상태 확인 실패:', error);
    return NextResponse.json({ 
      isActive: false, 
      message: '세션 상태 확인 중 오류가 발생했습니다.' 
    }, { status: 500 });
  }
} 