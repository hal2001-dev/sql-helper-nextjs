import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { format } from 'sql-formatter';
import { callOpenAI } from '@/lib/ai';

type SqlDialect = 'sql' | 'postgresql' | 'mysql' | 'sqlite' | 'transactsql' | 'plsql';

export async function POST(request: Request) {
  try {
    const { sql, useAi, dialect = 'sql' } = await request.json();

    if (!sql?.trim()) {
      return NextResponse.json(
        { message: 'SQL 쿼리가 필요합니다.' },
        { status: 400 }
      );
    }

    // AI 포맷팅이 요청된 경우
    if (useAi) {
      const session = await getServerSession(authOptions);
      
      if (!session) {
        return NextResponse.json(
          { message: 'AI 포맷팅을 사용하려면 로그인이 필요합니다.' },
          { status: 401 }
        );
      }

      console.log(`[AI 포맷팅 시작] 사용자: ${session.user?.email}`);
      console.log(`[입력 SQL] ${sql}`);
      console.log(`[DB 타입] ${dialect}`);

      const completion = await callOpenAI('format', sql, { 
        dialect,
        userId: session.user.email as string
      });
      const formattedSql = completion.choices[0].message.content?.trim() || sql;

      return NextResponse.json({ formattedSql });
    }

    // 정적 포맷팅 (비로그인 사용자도 사용 가능)
    const formattedSql = format(sql, {
      language: dialect as SqlDialect,
      keywordCase: 'upper',
      linesBetweenQueries: 1,
    });

    return NextResponse.json({ formattedSql });
  } catch (error) {
    console.error('포맷팅 에러:', error);
    return NextResponse.json(
      { message: '포맷팅 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
} 