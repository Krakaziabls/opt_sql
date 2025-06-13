import React, { useState } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { cn } from '../lib/utils';
import { QueryPlanResult, Operation, TableMetadata } from '../api/ast';
import { ChevronDown, ChevronUp, Clock, AlertTriangle, Info, Table, BarChart2, Copy, Check, Database } from 'lucide-react';
// @ts-ignore
import { diffWords, Change } from 'diff';
import { Bar } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
} from 'chart.js';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import rehypeSanitize from 'rehype-sanitize';

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend
);

interface TableMetadataInfo {
    columns: Array<{
        name: string;
        type: string;
        size?: number;
        nullable?: boolean;
        default?: string;
    }>;
    indexes: Array<{
        name: string;
        columns: string;
        unique?: boolean;
        type?: number;
    }>;
    statistics?: {
        estimated_rows?: number;
        pages?: number;
        total_size?: string;
        column_stats?: Record<string, {
            n_distinct?: number;
            null_frac?: number;
        }>;
    };
}

interface OptimizedSQLResponseProps {
    originalQuery: string;
    optimizedQuery: string;
    optimizationRationale: string;
    performanceImpact: string;
    potentialRisks: string;
    className?: string;
    originalPlan: QueryPlanResult | null;
    optimizedPlan: QueryPlanResult | null;
    executionMetrics: {
        originalTime: number;
        optimizedTime: number;
        improvement: number;
    };
    hasDatabaseConnection: boolean;
    tablesMetadata: Record<string, any> | null;
}

export const OptimizedSQLResponse: React.FC<OptimizedSQLResponseProps> = ({
    originalQuery,
    optimizedQuery,
    optimizationRationale,
    performanceImpact,
    potentialRisks,
    className,
    originalPlan,
    optimizedPlan,
    executionMetrics,
    hasDatabaseConnection = false,
    tablesMetadata
}) => {
    const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
        plans: false,
        rationale: false,
        impact: false,
        risks: false,
        metadata: false
    });

    const [copiedStates, setCopiedStates] = useState<Record<string, boolean>>({
        original: false,
        optimized: false
    });

    const copyToClipboard = async (text: string, type: 'original' | 'optimized') => {
        try {
            await navigator.clipboard.writeText(text);
            setCopiedStates(prev => ({ ...prev, [type]: true }));
            setTimeout(() => {
                setCopiedStates(prev => ({ ...prev, [type]: false }));
            }, 2000);
        } catch (err) {
            console.error('Failed to copy text: ', err);
        }
    };

    const toggleSection = (section: string) => {
        setExpandedSections(prev => ({
            ...prev,
            [section]: !prev[section]
        }));
    };

    const SectionHeader = ({ title, icon: Icon, expanded }: { title: string; icon: any; expanded: boolean }) => (
        <button
            onClick={() => toggleSection(title.toLowerCase())}
            className="flex items-center justify-between w-full p-4 bg-gray-800 rounded-t-lg hover:bg-gray-700 transition-colors"
        >
            <div className="flex items-center gap-2">
                <Icon className="w-5 h-5" />
                <h3 className="text-lg font-semibold">{title}</h3>
            </div>
            {expanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
        </button>
    );

    const renderOperation = (operation: Operation) => {
        return (
            <div className="bg-gray-800 p-3 rounded mb-2">
                <div className="font-medium text-white">{operation.type}</div>
                {operation.table && (
                    <div className="text-sm text-gray-300 mt-1">
                        Таблица: <span className="font-mono">{operation.table}</span>
                    </div>
                )}
                {operation.metadata && Object.entries(operation.metadata).length > 0 && (
                    <div className="text-sm text-gray-300 mt-1">
                        Метаданные: <pre className="mt-1 bg-gray-900 p-2 rounded">{JSON.stringify(operation.metadata, null, 2)}</pre>
                    </div>
                )}
                {operation.statistics && Object.entries(operation.statistics).length > 0 && (
                    <div className="text-sm text-gray-300 mt-1">
                        Статистика: <pre className="mt-1 bg-gray-900 p-2 rounded">{JSON.stringify(operation.statistics, null, 2)}</pre>
                    </div>
                )}
                {operation.keys && operation.keys.length > 0 && (
                    <div className="text-sm text-gray-300 mt-1">
                        Ключи: <span className="font-mono">{operation.keys.join(', ')}</span>
                    </div>
                )}
                {operation.conditions && operation.conditions.length > 0 && (
                    <div className="text-sm text-gray-300 mt-1">
                        Условия: <span className="font-mono">{operation.conditions.join(', ')}</span>
                    </div>
                )}
                {operation.additionalInfo && operation.additionalInfo.length > 0 && (
                    <div className="text-sm text-gray-300 mt-1">
                        Дополнительно: <pre className="mt-1 bg-gray-900 p-2 rounded">{operation.additionalInfo.join('\n')}</pre>
                    </div>
                )}
            </div>
        );
    };

    const renderQueryDiff = (original: string, optimized: string) => {
        const differences = diffWords(original, optimized);
        return (
            <div className="font-mono text-sm">
                {differences.map((part: Change, idx: number) => (
                    <span
                        key={idx}
                        className={part.added ? 'bg-green-900' : part.removed ? 'bg-red-900' : ''}
                    >
                        {part.value}
                    </span>
                ))}
            </div>
        );
    };

    const renderPerformanceChart = () => {
        if (!originalPlan || !optimizedPlan) return null;

        const data = {
            labels: ['Исходный запрос', 'Оптимизированный запрос'],
            datasets: [
                {
                    label: 'Время выполнения (мс)',
                    data: [originalPlan, optimizedPlan],
                    backgroundColor: ['rgba(255, 99, 132, 0.5)', 'rgba(75, 192, 192, 0.5)'],
                    borderColor: ['rgb(255, 99, 132)', 'rgb(75, 192, 192)'],
                    borderWidth: 1,
                },
            ],
        };

        const options = {
            responsive: true,
            plugins: {
                legend: {
                    position: 'top' as const,
                },
                title: {
                    display: true,
                    text: 'Сравнение времени выполнения',
                },
            },
        };

        return <Bar data={data} options={options} />;
    };

    const renderTableMetadata = (metadata: Record<string, TableMetadataInfo>) => {
        return Object.entries(metadata).map(([tableName, tableData]) => (
            <div key={tableName} className="mb-6">
                <h4 className="text-lg font-semibold mb-2">{tableName}</h4>
                
                {/* Колонки */}
                <div className="mb-4">
                    <h5 className="text-md font-medium mb-2">Колонки</h5>
                    <div className="grid grid-cols-5 gap-2 text-sm">
                        <div className="font-medium">Имя</div>
                        <div className="font-medium">Тип</div>
                        <div className="font-medium">Размер</div>
                        <div className="font-medium">Nullable</div>
                        <div className="font-medium">Default</div>
                        {tableData.columns.map((column, index) => (
                            <React.Fragment key={index}>
                                <div>{column.name}</div>
                                <div>{column.type}</div>
                                <div>{column.size || '-'}</div>
                                <div>{column.nullable ? 'Да' : 'Нет'}</div>
                                <div>{column.default || '-'}</div>
                            </React.Fragment>
                        ))}
                    </div>
                </div>

                {/* Индексы */}
                <div className="mb-4">
                    <h5 className="text-md font-medium mb-2">Индексы</h5>
                    <div className="grid grid-cols-4 gap-2 text-sm">
                        <div className="font-medium">Имя</div>
                        <div className="font-medium">Колонки</div>
                        <div className="font-medium">Уникальный</div>
                        <div className="font-medium">Тип</div>
                        {tableData.indexes.map((index, indexIndex) => (
                            <React.Fragment key={indexIndex}>
                                <div>{index.name}</div>
                                <div>{index.columns}</div>
                                <div>{index.unique ? 'Да' : 'Нет'}</div>
                                <div>{index.type || '-'}</div>
                            </React.Fragment>
                        ))}
                    </div>
                </div>

                {/* Статистика */}
                {tableData.statistics && (
                    <div>
                        <h5 className="text-md font-medium mb-2">Статистика</h5>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                            <div className="font-medium">Оценочное количество строк</div>
                            <div>{tableData.statistics.estimated_rows?.toLocaleString() || '-'}</div>
                            <div className="font-medium">Количество страниц</div>
                            <div>{tableData.statistics.pages?.toLocaleString() || '-'}</div>
                            <div className="font-medium">Общий размер</div>
                            <div>{tableData.statistics.total_size || '-'}</div>
                        </div>
                    </div>
                )}
            </div>
        ));
    };

    const renderPlan = (plan: QueryPlanResult) => {
        if (!plan || !plan.operations || plan.operations.length === 0) {
            return <div className="text-gray-400">Нет данных о плане выполнения</div>;
        }

        return (
            <div className="space-y-2">
                {plan.operations.map((op, index) => (
                    <div key={index} className="flex items-start space-x-2">
                        <span className="text-gray-400">•</span>
                        <div className="text-gray-300">
                            <div>{op.type}</div>
                            {op.tableName && (
                                <div className="text-blue-400">по таблице {op.tableName}</div>
                            )}
                            {op.metadata && Object.entries(op.metadata).length > 0 && (
                                <div className="text-sm text-gray-400 mt-1">
                                    {Object.entries(op.metadata).map(([key, value]) => (
                                        <div key={key}>
                                            {key}: {value}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                ))}
                {plan.cost && (
                    <div className="mt-2 text-sm text-gray-400">
                        Стоимость: {plan.cost.toFixed(2)}
                    </div>
                )}
                {plan.totalCost && (
                    <div className="text-sm text-gray-400">
                        Общая стоимость: {plan.totalCost}
                    </div>
                )}
                {plan.totalRows && (
                    <div className="text-sm text-gray-400">
                        Ожидаемое количество строк: {plan.totalRows}
                    </div>
                )}
                {plan.planningTimeMs && (
                    <div className="text-sm text-gray-400">
                        Время планирования: {plan.planningTimeMs.toFixed(2)} мс
                    </div>
                )}
                {plan.executionTimeMs && (
                    <div className="text-sm text-gray-400">
                        Время выполнения: {plan.executionTimeMs.toFixed(2)} мс
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className={cn("space-y-4 w-full", className)}>
            {/* Индикатор подключения к БД */}
            {hasDatabaseConnection && (
                <div className="flex items-center space-x-2 mb-4 text-sm">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                    <span className="text-gray-400">Подключено к базе данных</span>
                </div>
            )}

            {/* Сравнение запросов - всегда видимое */}
            <div className="bg-gray-900 rounded-lg p-4">
                <h3 className="text-lg font-medium mb-4 flex items-center">
                    <Info className="text-blue-400 mr-2" />
                    Сравнение запросов
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <div className="flex justify-between items-center mb-2">
                            <h4 className="text-sm font-medium text-gray-400">Исходный запрос</h4>
                            <button
                                onClick={() => copyToClipboard(originalQuery, 'original')}
                                className="p-1 hover:bg-gray-700 rounded transition-colors duration-200"
                                title="Копировать запрос"
                            >
                                {copiedStates.original ? (
                                    <Check className="w-4 h-4 text-green-400" />
                                ) : (
                                    <Copy className="w-4 h-4 text-gray-400" />
                                )}
                            </button>
                        </div>
                        <SyntaxHighlighter
                            language="sql"
                            style={vscDarkPlus}
                            customStyle={{ margin: 0, borderRadius: '0.375rem' }}
                        >
                            {originalQuery}
                        </SyntaxHighlighter>
                    </div>
                    <div>
                        <div className="flex justify-between items-center mb-2">
                            <h4 className="text-sm font-medium text-gray-400">Оптимизированный запрос</h4>
                            <button
                                onClick={() => copyToClipboard(optimizedQuery, 'optimized')}
                                className="p-1 hover:bg-gray-700 rounded transition-colors duration-200"
                                title="Копировать запрос"
                            >
                                {copiedStates.optimized ? (
                                    <Check className="w-4 h-4 text-green-400" />
                                ) : (
                                    <Copy className="w-4 h-4 text-gray-400" />
                                )}
                            </button>
                        </div>
                        <SyntaxHighlighter
                            language="sql"
                            style={vscDarkPlus}
                            customStyle={{ margin: 0, borderRadius: '0.375rem' }}
                        >
                            {optimizedQuery}
                        </SyntaxHighlighter>
                    </div>
                </div>
            </div>

            {/* Планы выполнения */}
            <div className="bg-gray-900 rounded-lg overflow-hidden">
                <button
                    onClick={() => toggleSection('plans')}
                    className="flex items-center justify-between w-full p-4 bg-gray-800 hover:bg-gray-700 transition-colors"
                >
                    <div className="flex items-center gap-2">
                        <BarChart2 className="w-5 h-5 text-blue-400" />
                        <h3 className="text-lg font-semibold">Планы выполнения</h3>
                    </div>
                    {expandedSections.plans ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                </button>
                
                <AnimatePresence>
                    {expandedSections.plans && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                        >
                            <div className="p-4 space-y-4">
                                {/* План исходного запроса */}
                                <div>
                                    <h4 className="text-md font-medium mb-2 text-gray-300">План исходного запроса</h4>
                                    {originalPlan ? renderPlan(originalPlan) : (
                                        <div className="text-gray-500">Нет данных о плане выполнения</div>
                                    )}
                                </div>

                                {/* План оптимизированного запроса */}
                                <div>
                                    <h4 className="text-md font-medium mb-2 text-gray-300">План оптимизированного запроса</h4>
                                    {optimizedPlan ? renderPlan(optimizedPlan) : (
                                        <div className="text-gray-500">Нет данных о плане выполнения</div>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Метрики выполнения */}
            {hasDatabaseConnection && executionMetrics && (
                <div className="bg-gray-900 rounded-lg p-4">
                    <h3 className="text-lg font-medium mb-4 flex items-center">
                        <Clock className="text-green-400 mr-2" />
                        Метрики выполнения
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-gray-800 p-4 rounded-lg">
                            <div className="text-sm text-gray-400">Исходное время</div>
                            <div className="text-2xl font-semibold text-white">{executionMetrics.originalTime.toFixed(2)} мс</div>
                        </div>
                        <div className="bg-gray-800 p-4 rounded-lg">
                            <div className="text-sm text-gray-400">Оптимизированное время</div>
                            <div className="text-2xl font-semibold text-white">{executionMetrics.optimizedTime.toFixed(2)} мс</div>
                        </div>
                        <div className="bg-gray-800 p-4 rounded-lg">
                            <div className="text-sm text-gray-400">Улучшение</div>
                            <div className="text-2xl font-semibold text-green-400">{executionMetrics.improvement.toFixed(1)}%</div>
                        </div>
                    </div>
                </div>
            )}

            {/* Рационализация оптимизации */}
            <div className="bg-gray-900 rounded-lg overflow-hidden">
                <button
                    onClick={() => toggleSection('rationale')}
                    className="flex items-center justify-between w-full p-4 bg-gray-800 hover:bg-gray-700 transition-colors"
                >
                    <div className="flex items-center gap-2">
                        <Info className="w-5 h-5 text-blue-400" />
                        <h3 className="text-lg font-semibold">Рационализация оптимизации</h3>
                    </div>
                    {expandedSections.rationale ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                </button>
                
                <AnimatePresence>
                    {expandedSections.rationale && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                        >
                            <div className="p-4">
                                <ReactMarkdown
                                    rehypePlugins={[rehypeSanitize]}
                                    components={{
                                        div: ({ node, ...props }) => <div className="prose prose-invert max-w-none" {...props} />
                                    }}
                                >
                                    {optimizationRationale}
                                </ReactMarkdown>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Влияние на производительность */}
            <div className="bg-gray-900 rounded-lg overflow-hidden">
                <button
                    onClick={() => toggleSection('impact')}
                    className="flex items-center justify-between w-full p-4 bg-gray-800 hover:bg-gray-700 transition-colors"
                >
                    <div className="flex items-center gap-2">
                        <BarChart2 className="w-5 h-5 text-green-400" />
                        <h3 className="text-lg font-semibold">Влияние на производительность</h3>
                    </div>
                    {expandedSections.impact ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                </button>
                
                <AnimatePresence>
                    {expandedSections.impact && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                        >
                            <div className="p-4">
                                <ReactMarkdown
                                    rehypePlugins={[rehypeSanitize]}
                                    components={{
                                        div: ({ node, ...props }) => <div className="prose prose-invert max-w-none" {...props} />
                                    }}
                                >
                                    {performanceImpact}
                                </ReactMarkdown>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Потенциальные риски */}
            <div className="bg-gray-900 rounded-lg overflow-hidden">
                <button
                    onClick={() => toggleSection('risks')}
                    className="flex items-center justify-between w-full p-4 bg-gray-800 hover:bg-gray-700 transition-colors"
                >
                    <div className="flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5 text-yellow-400" />
                        <h3 className="text-lg font-semibold">Потенциальные риски</h3>
                    </div>
                    {expandedSections.risks ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                </button>
                
                <AnimatePresence>
                    {expandedSections.risks && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                        >
                            <div className="p-4">
                                <ReactMarkdown
                                    rehypePlugins={[rehypeSanitize]}
                                    components={{
                                        div: ({ node, ...props }) => <div className="prose prose-invert max-w-none" {...props} />
                                    }}
                                >
                                    {potentialRisks}
                                </ReactMarkdown>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Метаданные таблиц */}
            {hasDatabaseConnection && tablesMetadata && Object.keys(tablesMetadata).length > 0 && (
                <div className="bg-gray-900 rounded-lg overflow-hidden">
                    <button
                        onClick={() => toggleSection('metadata')}
                        className="flex items-center justify-between w-full p-4 bg-gray-800 hover:bg-gray-700 transition-colors"
                    >
                        <div className="flex items-center gap-2">
                            <Table className="w-5 h-5 text-blue-400" />
                            <h3 className="text-lg font-semibold">Метаданные таблиц</h3>
                        </div>
                        {expandedSections.metadata ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </button>
                    
                    <AnimatePresence>
                        {expandedSections.metadata && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.2 }}
                                className="overflow-hidden"
                            >
                                <div className="p-4 space-y-4">
                                    {Object.entries(tablesMetadata).map(([tableName, metadata]) => (
                                        <div key={tableName} className="bg-gray-800 rounded-lg p-4">
                                            <h4 className="text-sm font-medium text-gray-300 mb-3">{tableName}</h4>
                                            
                                            {/* Колонки */}
                                            {metadata.columns && metadata.columns.length > 0 && (
                                                <div className="mb-4">
                                                    <h5 className="text-xs font-medium text-gray-400 mb-2">Колонки</h5>
                                                    <div className="grid grid-cols-4 gap-2 text-xs">
                                                        {metadata.columns.map((column: any) => (
                                                            <div key={column.name} className="bg-gray-700 p-2 rounded">
                                                                <div className="font-medium text-gray-300">{column.name}</div>
                                                                <div className="text-gray-400">{column.type}</div>
                                                                {column.nullable !== undefined && (
                                                                    <div className="text-gray-500">
                                                                        {column.nullable ? 'NULL' : 'NOT NULL'}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                            
                                            {/* Индексы */}
                                            {metadata.indexes && metadata.indexes.length > 0 && (
                                                <div>
                                                    <h5 className="text-xs font-medium text-gray-400 mb-2">Индексы</h5>
                                                    <div className="space-y-2">
                                                        {metadata.indexes.map((index: any, idx: number) => (
                                                            <div key={idx} className="bg-gray-700 p-2 rounded text-xs">
                                                                <div className="font-medium text-gray-300">{index.name}</div>
                                                                <div className="text-gray-400">Колонки: {index.columns}</div>
                                                                {index.unique && (
                                                                    <div className="text-green-400">Уникальный</div>
                                                                )}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            )}
        </div>
    );
};
