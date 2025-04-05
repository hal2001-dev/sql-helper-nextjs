'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { motion } from "framer-motion";
import { Code2Icon, PlayIcon, ChevronUpIcon, ChevronDownIcon } from "lucide-react";
import { SqlEditor } from '@/components/editor/SqlEditor';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { useRouter } from 'next/navigation';

type SqlDialect = 'sql' | 'postgresql' | 'mysql' | 'sqlite' | 'transactsql' | 'plsql';
type QueryResult = { [key: string]: string | number | null };

export default function Home() {
  const router = useRouter();
  const [sql, setSql] = useState('');
  const [dialect, setDialect] = useState<SqlDialect>('sql');
  const [result, setResult] = useState<QueryResult[]>([]);
  const [formattedSql, setFormattedSql] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [session, setSession] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('session');
      return saved ? JSON.parse(saved) : false;
    }
    return false;
  });
  const [isResultExpanded, setIsResultExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<'format' | 'execute'>('format');
  const [useAI, setUseAI] = useState(false);
  const [sqlExplanation, setSqlExplanation] = useState<string | null>(null);

  const handleFormat = async () => {
    if (!sql.trim()) {
      console.error('SQL을 입력해주세요.');
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
          dialect,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || '포맷팅 실패');
      }

      const data = await response.json();
      setFormattedSql(data.formattedSql);
      setResult([]); // 실행 결과 초기화
      console.log('포맷팅 완료');
    } catch (error) {
      console.error('포맷팅 에러:', error);
      console.error(error instanceof Error ? error.message : '포맷팅 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleExecute = async () => {
    if (!session) {
      console.error('로그인이 필요한 기능입니다.');
      return;
    }

    if (!sql.trim()) {
      console.error('SQL 쿼리를 입력해주세요.');
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
      setFormattedSql(null); // 포맷팅 결과 초기화
      console.log('SQL 쿼리가 성공적으로 실행되었습니다.');
    } catch (error) {
      console.error('쿼리 실행 에러:', error);
      console.error(error instanceof Error ? error.message : '쿼리 실행 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleExplain = async () => {
    if (!sql.trim()) {
      console.error('SQL을 입력해주세요.');
      return;
    }

    try {
      setIsLoading(true);
      const response = await fetch('/api/explain', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sql,
          dialect,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'SQL 설명 생성 실패');
      }

      const data = await response.json();
      setSqlExplanation(data.explanation);
      setFormattedSql(null);
      setResult([]);
    } catch (error) {
      console.error('SQL 설명 에러:', error);
      console.error(error instanceof Error ? error.message : 'SQL 설명 생성 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    setSession(false);
    localStorage.setItem('session', 'false');
    console.log('로그아웃');
  };

  const handleLogin = () => {
    router.push('/login');
  };

  return (
    <div className="min-h-screen flex flex-col">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col gap-6 flex-1">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
            SQL Helper
          </h1>
          {session ? (
            <Button 
              variant="outline" 
              className="bg-gray-900 border-gray-700 text-gray-200 hover:bg-gray-800"
              onClick={handleLogout}
            >
              로그아웃
            </Button>
          ) : (
            <Button 
              variant="outline" 
              className="bg-gray-900 border-gray-700 text-gray-200 hover:bg-gray-800"
              onClick={handleLogin}
            >
              로그인
            </Button>
          )}
        </div>

        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'format' | 'execute')} className="w-full">
          <TabsList className="w-full bg-gray-900 border-2 border-gray-700 p-1">
            <TabsTrigger 
              value="format" 
              className="flex-1 data-[state=active]:bg-gray-800 data-[state=active]:text-gray-200"
            >
              <div className="flex items-center gap-2">
                <Code2Icon className="h-5 w-5 text-blue-500" />
                <span>SQL 포맷팅</span>
              </div>
            </TabsTrigger>
            <TabsTrigger 
              value="execute" 
              className="flex-1 data-[state=active]:bg-gray-800 data-[state=active]:text-gray-200"
            >
              <div className="flex items-center gap-2">
                <PlayIcon className="h-5 w-5 text-green-500" />
                <span>SQL 설명</span>
              </div>
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <Card className="overflow-hidden border-none shadow-lg bg-gradient-to-b from-gray-900 to-gray-800 flex-1">
          <CardHeader className="space-y-1 border-b border-gray-700/50">
            <CardTitle className="text-2xl font-bold text-white">SQL 실행기</CardTitle>
            <CardDescription className="text-gray-400">
              SQL 쿼리를 작성하고 실행하여 결과를 확인하세요
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6 bg-gray-900/50 h-[calc(100vh-25rem)] overflow-hidden">
            <div className="flex flex-col lg:flex-row gap-8 h-full">
              <div className="flex-1 min-w-0 h-full flex flex-col">
                <div className="relative flex-1 overflow-hidden">
                  <Label className="text-lg font-semibold mb-3 block text-gray-200">SQL 입력</Label>
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="relative rounded-xl border-2 border-gray-700 bg-gray-800 shadow-sm transition-all hover:shadow-md h-[calc(100%-2.5rem)] overflow-hidden"
                  >
                    <div className="h-full">
                      <SqlEditor 
                        value={sql} 
                        onChange={setSql}
                        className="h-full"
                        height="100%"
                        showCopyButton
                        theme="vs-dark"
                      />
                    </div>
                  </motion.div>
                </div>
              </div>

              <div className="flex lg:flex-col justify-center items-center gap-4 lg:py-20 shrink-0">
                <Select value={dialect} onValueChange={(value: SqlDialect) => setDialect(value)}>
                  <SelectTrigger className="w-[180px] bg-gray-900 border-gray-700 text-gray-200">
                    <SelectValue placeholder="DB 타입 선택" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-900 border-gray-700">
                    <SelectItem value="sql">Standard SQL</SelectItem>
                    <SelectItem value="postgresql">PostgreSQL</SelectItem>
                    <SelectItem value="mysql">MySQL</SelectItem>
                    <SelectItem value="sqlite">SQLite</SelectItem>
                    <SelectItem value="transactsql">MS SQL Server</SelectItem>
                    <SelectItem value="plsql">Oracle</SelectItem>
                  </SelectContent>
                </Select>

                <div className="flex lg:flex-col gap-3">
                  {activeTab === 'format' && (
                    <>
                      <Button 
                        onClick={handleFormat} 
                        disabled={isLoading}
                        variant="outline"
                        className="h-11 px-6 bg-gray-800 hover:bg-gray-700 border-gray-700 text-gray-200 whitespace-nowrap"
                      >
                        <Code2Icon className="mr-2 h-5 w-5" />
                        {isLoading ? '포맷팅 중...' : '포맷팅'}
                      </Button>
                      <Button 
                        onClick={handleExecute} 
                        disabled={isLoading}
                        className="h-11 px-6 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white whitespace-nowrap"
                      >
                        <PlayIcon className="mr-2 h-5 w-5" />
                        {isLoading ? '실행 중...' : '실행'}
                      </Button>
                    </>
                  )}
                  {activeTab === 'execute' && (
                    <Button 
                      onClick={handleExplain}
                      disabled={isLoading}
                      className="h-11 px-6 bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 text-white whitespace-nowrap"
                    >
                      <PlayIcon className="mr-2 h-5 w-5" />
                      {isLoading ? '설명 생성 중...' : 'SQL 설명'}
                    </Button>
                  )}
                </div>

                {activeTab === 'format' && (
                  <div className="flex items-center gap-2 bg-gray-800/50 px-4 py-2 rounded-lg">
                    <Switch
                      checked={useAI}
                      onCheckedChange={setUseAI}
                      className="data-[state=checked]:bg-blue-600"
                    />
                    <span className="text-sm text-gray-200">AI 포맷팅 사용</span>
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0 h-full flex flex-col">
                <div className="relative flex-1 overflow-hidden">
                  <div className="flex items-center justify-between mb-3">
                    <Label className="text-lg font-semibold text-gray-200">
                      {formattedSql ? 'SQL 포맷팅 결과' : '실행 결과'}
                    </Label>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsResultExpanded(!isResultExpanded)}
                      className="text-gray-400 hover:text-gray-200"
                    >
                      {isResultExpanded ? <ChevronDownIcon className="h-5 w-5" /> : <ChevronUpIcon className="h-5 w-5" />}
                    </Button>
                  </div>
                  <motion.div 
                    className="relative rounded-xl border-2 border-gray-700 bg-gray-800 shadow-sm transition-all hover:shadow-md h-[calc(100%-2.5rem)] overflow-hidden"
                    animate={{ height: isResultExpanded ? '100%' : '100%' }}
                  >
                    <div className="h-full">
                      {formattedSql ? (
                        <SqlEditor
                          value={formattedSql}
                          onChange={() => {}}
                          readOnly
                          className="h-full"
                          height="100%"
                          showCopyButton
                          theme="vs-dark"
                        />
                      ) : sqlExplanation ? (
                        <div className="p-6 text-gray-200 space-y-4 h-full overflow-auto">
                          <h3 className="text-xl font-semibold text-blue-400">SQL 쿼리 설명</h3>
                          <div className="whitespace-pre-wrap font-mono text-sm">
                            {sqlExplanation}
                          </div>
                        </div>
                      ) : result.length > 0 ? (
                        <div className="p-4 overflow-auto h-full">
                          <Table>
                            <TableHeader>
                              <TableRow className="border-gray-700 bg-gray-800/50">
                                {Object.keys(result[0]).map((key) => (
                                  <TableHead key={key} className="font-semibold text-gray-300 sticky top-0 bg-gray-800/95 backdrop-blur-sm z-10">
                                    {key}
                                  </TableHead>
                                ))}
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {result.map((row, i) => (
                                <TableRow key={i} className="border-gray-700 hover:bg-gray-700/50">
                                  {Object.values(row).map((value, j) => (
                                    <TableCell key={j} className="font-mono text-gray-300 whitespace-nowrap">
                                      {value === null ? 
                                        <span className="text-gray-500 italic">null</span> : 
                                        String(value)
                                      }
                                    </TableCell>
                                  ))}
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      ) : (
                        <div className="h-full" />
                      )}
                    </div>
                  </motion.div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
