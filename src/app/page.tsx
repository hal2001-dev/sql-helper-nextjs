'use client';

import { useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { SqlEditor } from '@/components/editor/SqlEditor';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type QueryResult = Record<string, unknown>[];
type SqlDialect = 'sql' | 'postgresql' | 'mysql' | 'sqlite' | 'mssql' | 'plsql';

export default function Home() {
  const { data: session } = useSession();
  const [sql, setSql] = useState('');
  const [result, setResult] = useState<QueryResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [formattedSql, setFormattedSql] = useState('');
  const [useAiFormat, setUseAiFormat] = useState(false);
  const [dialect, setDialect] = useState<SqlDialect>('sql');

  const handleLogout = async () => {
    try {
      await signOut({ callbackUrl: '/' });
      toast.success('로그아웃되었습니다.');
    } catch {
      toast.error('로그아웃 중 오류가 발생했습니다.');
    }
  };

  const handleExecute = async () => {
    if (!session) {
      toast.error('로그인이 필요한 기능입니다.');
      return;
    }

    if (!sql.trim()) {
      toast.error('SQL 쿼리를 입력해주세요.');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/execute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: sql }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || '쿼리 실행 중 오류가 발생했습니다.');
      }

      setResult(data);
      toast.success('SQL 쿼리가 성공적으로 실행되었습니다.');
    } catch (error) {
      console.error('쿼리 실행 에러:', error);
      toast.error(error instanceof Error ? error.message : '쿼리 실행 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFormat = async () => {
    if (!sql.trim()) {
      toast.error('SQL을 입력해주세요.');
      return;
    }

    try {
      setIsLoading(true);
      const response = await fetch('/api/format', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sql,
          useAi: useAiFormat && !!session,
          dialect,
        }),
      });

      if (!response.ok) {
        throw new Error('포맷팅 실패');
      }

      const data = await response.json();
      setFormattedSql(data.formattedSql);
      toast.success('포맷팅 완료');
    } catch {
      toast.error('포맷팅 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">SQL Helper</h1>
        <div>
          {session ? (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                {session.user?.email}
              </span>
              <Button variant="outline" onClick={handleLogout}>
                로그아웃
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => window.location.href = '/auth/signin'}>
                로그인
              </Button>
              <Button onClick={() => window.location.href = '/auth/signup'}>
                회원가입
              </Button>
            </div>
          )}
        </div>
      </div>

      <Tabs defaultValue="format" className="space-y-4">
        <TabsList>
          <TabsTrigger value="format">포맷팅</TabsTrigger>
          <TabsTrigger value="execute">실행</TabsTrigger>
          <TabsTrigger value="explain">SQL 설명</TabsTrigger>
        </TabsList>

        <TabsContent value="format" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>SQL 포맷팅</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>입력 SQL</Label>
                  <SqlEditor value={sql} onChange={setSql} />
                </div>
                <div className="space-y-2">
                  <Label>포맷팅 결과</Label>
                  <SqlEditor 
                    value={formattedSql} 
                    onChange={() => {}} 
                    readOnly 
                  />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="ai-format"
                      checked={useAiFormat}
                      onCheckedChange={setUseAiFormat}
                      disabled={!session}
                    />
                    <Label htmlFor="ai-format">
                      AI 포맷팅 사용 {!session && '(로그인 필요)'}
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Label>DB 타입:</Label>
                    <Select value={dialect} onValueChange={(value: SqlDialect) => setDialect(value)}>
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="DB 타입 선택" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sql">Standard SQL</SelectItem>
                        <SelectItem value="postgresql">PostgreSQL</SelectItem>
                        <SelectItem value="mysql">MySQL</SelectItem>
                        <SelectItem value="sqlite">SQLite</SelectItem>
                        <SelectItem value="transactsql">MS SQL Server</SelectItem>
                        <SelectItem value="plsql">Oracle</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Button onClick={handleFormat} disabled={isLoading}>
                  {isLoading ? '포맷팅 중...' : '포맷팅하기'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="execute" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>SQL 실행</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="h-[300px] border rounded-md">
                <SqlEditor
                  value={sql}
                  onChange={setSql}
                  height="300px"
                />
              </div>
              <div className="flex justify-end">
                <Button 
                  onClick={handleExecute}
                  disabled={isLoading}
                >
                  {isLoading ? '실행 중...' : '실행하기'}
                </Button>
              </div>
              {!session && (
                <p className="text-sm text-muted-foreground text-center">
                  SQL 실행을 위해서는 로그인이 필요합니다.
                </p>
              )}
            </CardContent>
          </Card>

          {result && (
            <Card>
              <CardHeader>
                <CardTitle>실행 결과</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="bg-muted p-4 rounded-md overflow-auto">
                  {JSON.stringify(result, null, 2)}
                </pre>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="explain">
          <Card>
            <CardHeader>
              <CardTitle>SQL 설명</CardTitle>
            </CardHeader>
            <CardContent>
              <p>SQL 설명 기능 준비 중...</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
