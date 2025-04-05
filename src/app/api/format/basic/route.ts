import { NextResponse } from 'next/server';
import { format } from 'sql-formatter';

export async function POST(request: Request) {
  console.log('\n[기본 포맷팅 요청] =====================');
  
  try {
    const { sql, language = 'postgresql' } = await request.json();
    
    if (!sql) {
      console.log('❌ SQL 쿼리 누락');
      return NextResponse.json(
        { error: 'SQL 쿼리를 입력해주세요.' },
        { status: 400 }
      );
    }
    
    console.log('입력 쿼리:', sql);
    console.log('언어:', language);
    
    // SQL 포맷팅
    const formattedSql = format(sql, {
      language: language,
      keywordCase: 'upper',
      linesBetweenQueries: 2,
      indentStyle: 'standard'
    });
    
    console.log('포맷팅 결과:', formattedSql);
    console.log('====================================\n');
    
    return NextResponse.json({ 
      result: formattedSql 
    });
    
  } catch (error) {
    console.error('❌ 포맷팅 실패:', error);
    return NextResponse.json(
      { error: 'SQL 포맷팅 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
} 