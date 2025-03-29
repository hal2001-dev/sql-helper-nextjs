'use client';

import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

interface RequireLoginOverlayProps {
  onClose: () => void;
}

export function RequireLoginOverlay({ onClose }: RequireLoginOverlayProps) {
  const router = useRouter();

  const handleLogin = () => {
    router.push('/login');
  };

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50">
      <div className="fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 sm:rounded-lg">
        <div className="flex flex-col space-y-2 text-center">
          <h2 className="text-lg font-semibold">로그인이 필요합니다</h2>
          <p className="text-sm text-muted-foreground">
            이 기능을 사용하기 위해서는 로그인이 필요합니다.
          </p>
        </div>
        <div className="flex justify-center gap-2">
          <Button variant="outline" onClick={onClose}>
            취소
          </Button>
          <Button onClick={handleLogin}>
            로그인하기
          </Button>
        </div>
      </div>
    </div>
  );
} 