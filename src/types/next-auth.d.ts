import 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      email?: string | null;
      name?: string | null;
    }
  }
}

declare module '@auth/prisma-adapter' {
  interface AdapterUser {
    password: string;
  }
} 