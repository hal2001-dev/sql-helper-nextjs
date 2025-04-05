import { getServerSession, AuthOptions } from 'next-auth';
import { JWT } from 'next-auth/jwt';
import CredentialsProvider from 'next-auth/providers/credentials';
import { compare } from 'bcryptjs';
import { Pool } from 'pg';
import { queries } from './sql/queries';
import { createSession, validateSession } from './session';
import crypto from 'crypto';
import { getRedisClient } from './redis';
import jwt from 'jsonwebtoken';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export const authOptions: AuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        console.log('[인증 시도]', { email: credentials?.email });

        if (!credentials?.email || !credentials?.password) {
          console.error('[인증 실패] 이메일 또는 비밀번호 누락');
          throw new Error('이메일과 비밀번호를 입력해주세요.');
        }

        try {
          const { rows } = await pool.query(queries.user.login, [credentials.email]);
          const user = rows[0];

          console.log('[사용자 조회]', {
            found: !!user,
            email: credentials.email
          });

          if (!user || !user.password) {
            console.error('[인증 실패] 사용자 없음');
            throw new Error('등록되지 않은 이메일입니다.');
          }

          const isValid = await compare(credentials.password, user.password);

          console.log('[비밀번호 검증]', {
            isValid,
            email: credentials.email
          });

          if (!isValid) {
            console.error('[인증 실패] 비밀번호 불일치');
            throw new Error('비밀번호가 일치하지 않습니다.');
          }

          console.log('[인증 성공]', {
            id: user.id,
            email: user.email
          });

          return {
            id: user.id,
            email: user.email,
            name: user.name
          };
        } catch (error) {
          console.error('[인증 오류]', error);
          throw error;
        }
      }
    })
  ],
  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60, // 24시간
  },
  callbacks: {
    async jwt({ token, user }) {
      console.log('[JWT 콜백]', { 
        hasUser: !!user, 
        tokenBefore: token 
      });
      
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
      }
      
      console.log('[JWT 토큰 생성됨]', token);
      return token;
    },
    async session({ session, token }) {
      console.log('[세션 콜백]', { 
        sessionBefore: session, 
        token 
      });
      
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.email = token.email as string;
        session.user.name = token.name as string;
      }
      
      console.log('[세션 생성됨]', session);
      return session;
    }
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === 'development',
};

export async function getSession() {
  return await getServerSession(authOptions);
}

export async function getCurrentUser() {
  const session = await getSession();
  return session?.user;
}

export async function validateCurrentSession(email: string, sessionToken: string) {
  return await validateSession(email, sessionToken);
}

export async function checkTokenUsage(userId: string): Promise<{
  canUse: boolean;
  currentUsage: number;
  remaining: number;
}> {
  const today = new Date().toISOString().split('T')[0].replace(/-/g, '');
  const result = await pool.query(queries.tokenUsage.get, [userId, today]);
  const currentUsage = Number(result.rows[0]?.tokens_used) || 0;
  const remaining = 10000 - currentUsage;

  return {
    canUse: currentUsage < 10000,
    currentUsage,
    remaining,
  };
} 