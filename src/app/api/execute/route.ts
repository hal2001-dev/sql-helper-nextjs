import { NextResponse } from "next/server";
import { z } from "zod";
import { Pool } from 'pg';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const executeSchema = z.object({
  query: z.string().min(1, 'SQL 쿼리를 입력해주세요.'),
});

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { message: '로그인이 필요합니다.' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { query } = executeSchema.parse(body);

    // SELECT 쿼리인 경우에만 실행 허용
    if (!query.trim().toLowerCase().startsWith('select')) {
      return NextResponse.json(
        { message: 'SELECT 쿼리만 실행 가능합니다.' },
        { status: 400 }
      );
    }

    const { rows } = await pool.query(query);
    return NextResponse.json(rows);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: error.errors[0].message },
        { status: 400 }
      );
    }

    console.error('쿼리 실행 에러:', error);
    return NextResponse.json(
      { message: '쿼리 실행 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
} 