'use client';

import { Button } from "@/components/ui/button";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";

export function Navigation() {
  const { data: session } = useSession();
  const router = useRouter();

  const handleLogin = () => {
    router.push('/login');
  };

  const handleSignUp = () => {
    router.push('/signup');
  };

  const handleLogout = () => {
    signOut({ callbackUrl: '/' });
  };

  return (
    <nav className="border-b">
      <div className="container flex items-center justify-between h-14">
        <div className="font-semibold">SQL Helper</div>
        <div>
          {session ? (
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground">
                {session.user?.email}
              </span>
              <Button variant="outline" size="sm" onClick={handleLogout}>
                로그아웃
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleSignUp}
              >
                회원가입
              </Button>
              <Button 
                size="sm" 
                onClick={handleLogin}
              >
                로그인
              </Button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
} 