'use client';

import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import { AuthProvider } from "@/components/auth/AuthProvider";
import { useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';

const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body className={inter.className}>
        <AuthProvider>
          <SessionHandler />
          {children}
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}

function SessionHandler() {
  const { data: session } = useSession();

  useEffect(() => {
    const handleBeforeUnload = async () => {
      if (session) {
        try {
          // 세션 종료 요청
          await fetch('/api/auth/signout', { 
            method: 'POST',
            credentials: 'include'
          });
        } catch (error) {
          console.error('세션 종료 실패:', error);
        }
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [session]);

  return null;
}
