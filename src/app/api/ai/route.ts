import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { callOpenAI } from '@/lib/ai';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
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

    console.log(`[AI 요청 시작] 사용자: ${session.user?.email}`);
    console.log(`[입력 SQL] ${sql}`);
    console.log(`[DB 타입] ${dialect}`);

    const completion = await callOpenAI('format', sql, { 
      dialect,
      userId: session.user.email as string
    });

    const formattedSql = completion.choices[0].message.content?.trim() || sql;

    // 토큰 사용량 계산 및 기록
    console.log('OpenAI Response:', {
      usage: completion.usage,
      promptTokens: completion.usage?.prompt_tokens,
      completionTokens: completion.usage?.completion_tokens
    });

    return NextResponse.json({ formattedSql });
  } catch (error) {
    console.error('AI 처리 에러:', error);
    return NextResponse.json(
      { message: 'AI 처리 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
} 