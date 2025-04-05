'use client';

import { useTheme } from 'next-themes';
import Editor from '@monaco-editor/react';
import { cn } from '@/lib/utils';
import { ClipboardIcon } from 'lucide-react';
import { toast } from 'sonner';

export interface SqlEditorProps {
  value: string;
  onChange: (value: string) => void;
  readOnly?: boolean;
  className?: string;
  showCopyButton?: boolean;
  theme?: string;
  height?: string;
}

export function SqlEditor({
  value,
  onChange,
  readOnly = false,
  className,
  showCopyButton = false,
  theme = 'vs-dark',
  height = '100%',
}: SqlEditorProps) {
  const { theme: systemTheme } = useTheme();

  return (
    <div className={cn('relative', className)}>
      <Editor
        value={value}
        onChange={(value) => onChange(value || '')}
        language="sql"
        theme={theme}
        height={height}
        options={{
          minimap: { enabled: false },
          scrollBeyondLastLine: false,
          fontSize: 14,
          lineNumbers: 'on',
          readOnly,
          wordWrap: 'on',
          automaticLayout: true,
        }}
      />
      {showCopyButton && (
        <button
          onClick={() => {
            navigator.clipboard.writeText(value);
            toast.success('SQL이 복사되었습니다.');
          }}
          className="absolute top-2 right-2 p-2 rounded-md bg-gray-700/50 hover:bg-gray-600/50 text-gray-400 hover:text-gray-200 transition-colors z-50"
          title="SQL 복사"
        >
          <ClipboardIcon className="h-4 w-4" />
        </button>
      )}
    </div>
  );
} 