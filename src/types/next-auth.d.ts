import 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      email?: string | null;
      name?: string | null;
    };
    jti?: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    jti?: string;
  }
}

declare module '@auth/prisma-adapter' {
  interface AdapterUser {
    password: string;
  }
} 