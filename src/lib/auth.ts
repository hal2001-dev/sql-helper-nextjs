import { getServerSession, NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { compare } from 'bcryptjs';
import { Pool } from 'pg';
import { queries } from './sql/queries';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: "이메일", type: "email" },
        password: { label: "비밀번호", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('이메일과 비밀번호를 입력해주세요.');
        }

        // 사용자 찾기
        const { rows } = await pool.query(queries.user.login, [credentials.email]);
        const user = rows[0];

        if (!user) {
          throw new Error('이메일 또는 비밀번호가 일치하지 않습니다.');
        }

        // 비밀번호 확인
        const isPasswordValid = await compare(credentials.password, user.password);

        if (!isPasswordValid) {
          throw new Error('이메일 또는 비밀번호가 일치하지 않습니다.');
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
        };
      }
    })
  ],
  pages: {
    signIn: '/login',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.email;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
      }
      return session;
    }
  },
  session: {
    strategy: 'jwt',
  },
};

export async function getSession() {
  return await getServerSession(authOptions);
}

export async function getCurrentUser() {
  const session = await getSession();
  return session?.user;
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