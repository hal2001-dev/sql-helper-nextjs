'use client';

import Editor from '@monaco-editor/react';
import { Button } from '@/components/ui/button';
import { Copy } from 'lucide-react';
import { toast } from 'sonner';

interface SqlEditorProps {
  value: string;
  onChange: (value: string) => void;
  height?: string;
  options?: Parameters<typeof Editor>[0]['options'];
  showCopyButton?: boolean;
  readOnly?: boolean;
}

export function SqlEditor({ 
  value, 
  onChange, 
  height = '400px', 
  options,
  showCopyButton = false,
  readOnly = false
}: SqlEditorProps) {
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      toast.success('복사되었습니다.');
    } catch {
      toast.error('복사에 실패했습니다.');
    }
  };

  return (
    <div className="relative">
      <Editor
        height={height}
        defaultLanguage="sql"
        value={value}
        onChange={(value) => onChange(value || '')}
        theme="vs-dark"
        options={{
          minimap: { enabled: false },
          fontSize: 14,
          lineNumbers: 'on',
          roundedSelection: false,
          automaticLayout: true,
          wordWrap: 'on',
          formatOnPaste: true,
          formatOnType: true,
          scrollbar: {
            vertical: 'visible',
            horizontal: 'visible',
            verticalScrollbarSize: 10,
            horizontalScrollbarSize: 10,
          },
          overviewRulerBorder: false,
          scrollBeyondLastLine: true,
          readOnly,
          ...options,
        }}
      />
      {showCopyButton && (
        <div className="absolute top-2 right-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleCopy}
            className="h-8 w-8 bg-background/50 hover:bg-background/80"
          >
            <Copy className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
} 