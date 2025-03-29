import { NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { z } from "zod";
import { randomUUID } from "crypto";
import { Pool } from 'pg';
import fs from 'fs';
import path from 'path';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const signupSchema = z.object({
  email: z.string().email('유효한 이메일을 입력해주세요.'),
  password: z.string().min(6, '비밀번호는 최소 6자 이상이어야 합니다.'),
  name: z.string().optional(),
});

// SQL 쿼리 로드
const sqlPath = path.join(process.cwd(), 'src', 'lib', 'sql', 'auth.sql');
const sqlContent = fs.readFileSync(sqlPath, 'utf8');
const queries = sqlContent.split('--').reduce((acc, query) => {
  const [name, ...content] = query.trim().split('\n');
  if (name && content.length > 0) {
    acc[name.trim()] = content.join('\n').trim();
  }
  return acc;
}, {} as Record<string, string>);

const LOGIN_QUERY = queries['LOGIN_QUERY'];
const SIGNUP_QUERY = queries['SIGNUP_QUERY'];

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, password, name } = signupSchema.parse(body);

    // 이메일 중복 확인
    console.log('이메일 중복 확인 쿼리:', LOGIN_QUERY);
    console.log('파라미터:', [email]);
    const { rows: existingUsers } = await pool.query(LOGIN_QUERY, [email]);
    console.log('중복 확인 결과:', existingUsers);

    if (existingUsers.length > 0) {
      return NextResponse.json(
        { message: '이미 등록된 이메일입니다.' },
        { status: 400 }
      );
    }

    // 비밀번호 해시화
    const hashedPassword = await hash(password, 10);

    // 사용자 생성
    const userId = randomUUID();
    console.log('회원가입 쿼리:', SIGNUP_QUERY);
    console.log('파라미터:', [userId, email, hashedPassword, name || null]);
    const { rows } = await pool.query(SIGNUP_QUERY, [
      userId,
      email,
      hashedPassword,
      name || null
    ]);
    console.log('회원가입 결과:', rows);

    return NextResponse.json({
      message: '회원가입이 완료되었습니다.',
      user: rows[0]
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: error.errors[0].message },
        { status: 400 }
      );
    }

    console.error('회원가입 에러:', error);
    return NextResponse.json(
      { message: '회원가입 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
} 