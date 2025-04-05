import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { callOpenAI } from '@/lib/ai';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    console.log('\n[SQL 설명 API 요청]', {
      hasSession: !!session,
      user: session?.user,
      email: session?.user?.email
    });
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { message: '로그인이 필요합니다.' },
        { status: 401 }
      );
    }

    const { sql, dialect = 'sql' } = await request.json();

    if (!sql?.trim()) {
      return NextResponse.json(
        { message: 'SQL 쿼리가 필요합니다.' },
        { status: 400 }
      );
    }

    console.log(`[SQL 설명 요청] 사용자: ${session.user.email}`);
    console.log(`[입력 SQL] ${sql}`);
    console.log(`[DB 타입] ${dialect}`);

    const completion = await callOpenAI('explain', sql, { 
      dialect,
      userId: session.user.id
    });

    const explanation = completion.choices[0].message.content?.trim();

    if (!explanation) {
      return NextResponse.json(
        { message: 'SQL 설명 생성에 실패했습니다.' },
        { status: 500 }
      );
    }

    return NextResponse.json({ explanation });
  } catch (error) {
    console.error('SQL 설명 에러:', error);
    return NextResponse.json(
      { message: 'SQL 설명 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
} 