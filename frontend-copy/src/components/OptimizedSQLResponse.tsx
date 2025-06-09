import React from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { cn } from '../lib/utils';

interface OptimizedSQLResponseProps {
    optimizedSQL: string;
    comments: string;
    className?: string;
}

export const OptimizedSQLResponse: React.FC<OptimizedSQLResponseProps> = ({
    optimizedSQL,
    comments,
    className
}) => {
    return (
        <div className={cn('flex flex-col gap-4', className)}>
            <div className="bg-[#1E1E1E] rounded-lg p-4">
                <h3 className="text-sm font-semibold mb-2 text-gray-300">Оптимизированный SQL</h3>
                <SyntaxHighlighter
                    language="sql"
                    style={vscDarkPlus}
                    customStyle={{
                        background: 'transparent',
                        padding: 0,
                        margin: 0,
                        fontSize: '14px',
                        maxWidth: '100%',
                        width: '100%',
                        overflowX: 'auto'
                    }}
                    wrapLines={true}
                >
                    {optimizedSQL}
                </SyntaxHighlighter>
            </div>
            
            <div className="bg-[#2A2A2A] rounded-lg p-4">
                <h3 className="text-sm font-semibold mb-2 text-gray-300">Обоснование изменений</h3>
                <div className="text-sm text-gray-200 whitespace-pre-wrap">
                    {comments}
                </div>
            </div>
        </div>
    );
}; 