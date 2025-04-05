'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import Link from "next/link";
import { signIn } from "next-auth/react";

export default function LoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    console.log('로그인 시도:', { email });

    try {
      // 폼 데이터 로깅
      console.log('%c[로그인 폼 제출]', 'color: blue; font-weight: bold', {
        email,
        timestamp: new Date().toISOString()
      });
      
      // signIn 호출 직전
      console.log('%c[NextAuth 호출 시작]', 'color: purple; font-weight: bold');
      
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
        callbackUrl: '/'
      });

      // 응답 로깅
      console.log('%c[NextAuth 응답 수신]', 'color: green; font-weight: bold', {
        ok: result?.ok,
        status: result?.status,
        url: result?.url,
        error: result?.error,
        timestamp: new Date().toISOString()
      });

      if (!result) {
        console.error('%c[오류] 응답 없음', 'color: red; font-weight: bold');
        toast.error('로그인 처리 중 오류가 발생했습니다.');
        return;
      }

      if (result.error) {
        console.error('%c[인증 실패]', 'color: red; font-weight: bold', {
          error: result.error,
          timestamp: new Date().toISOString()
        });
        toast.error(result.error || '로그인에 실패했습니다.');
        return;
      }

      if (result.ok) {
        console.log('%c[로그인 성공]', 'color: green; font-weight: bold', {
          redirectUrl: result.url,
          timestamp: new Date().toISOString()
        });
        toast.success('로그인 성공!');
        
        console.log('%c[페이지 이동 시작]', 'color: blue; font-weight: bold', {
          to: result.url || '/',
          timestamp: new Date().toISOString()
        });
        
        router.push(result.url || '/');
      }
    } catch (error) {
      console.error('%c[예외 발생]', 'color: red; background: yellow; font-weight: bold', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        timestamp: new Date().toISOString()
      });
      toast.error('로그인 처리 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container flex items-center justify-center min-h-[calc(100vh-4rem)]">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">로그인</CardTitle>
          <CardDescription>
            SQL Helper에 오신 것을 환영합니다.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">이메일</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="name@example.com"
                required
                autoComplete="email"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">비밀번호</Label>
              <Input
                id="password"
                name="password"
                type="password"
                required
                autoComplete="current-password"
              />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? '처리 중...' : '로그인'}
            </Button>
            <div className="text-center text-sm">
              <span className="text-muted-foreground">계정이 없으신가요? </span>
              <Link href="/signup" className="text-primary hover:underline">
                회원가입
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
} 