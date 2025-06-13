import React from 'react';
import { QueryPlanResult, Operation } from '../api/ast';

interface QueryPlanViewProps {
    plan: QueryPlanResult;
}

export const QueryPlanView: React.FC<QueryPlanViewProps> = ({ plan }) => {
    const renderOperation = (operation: Operation) => {
        return (
            <div className="bg-white p-3 rounded shadow-sm mb-2">
                <div className="font-medium text-gray-800">{operation.type}</div>
                {operation.tableName && (
                    <div className="text-sm text-gray-600 mt-1">
                        Таблица: <span className="font-mono">{operation.tableName}</span>
                    </div>
                )}
                {operation.metadata && Object.entries(operation.metadata).length > 0 && (
                    <div className="text-sm text-gray-600 mt-1">
                        Метаданные: <pre className="mt-1 bg-gray-50 p-2 rounded">{JSON.stringify(operation.metadata, null, 2)}</pre>
                    </div>
                )}
                {operation.statistics && Object.entries(operation.statistics).length > 0 && (
                    <div className="text-sm text-gray-600 mt-1">
                        Статистика: <pre className="mt-1 bg-gray-50 p-2 rounded">{JSON.stringify(operation.statistics, null, 2)}</pre>
                    </div>
                )}
                {operation.keys && operation.keys.length > 0 && (
                    <div className="text-sm text-gray-600 mt-1">
                        Ключи: <span className="font-mono">{operation.keys.join(', ')}</span>
                    </div>
                )}
                {operation.conditions && operation.conditions.length > 0 && (
                    <div className="text-sm text-gray-600 mt-1">
                        Условия: <span className="font-mono">{operation.conditions.join(', ')}</span>
                    </div>
                )}
                {operation.additionalInfo && operation.additionalInfo.length > 0 && (
                    <div className="text-sm text-gray-600 mt-1">
                        Дополнительно: <pre className="mt-1 bg-gray-50 p-2 rounded">{operation.additionalInfo.join('\n')}</pre>
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="space-y-4">
            <div className="text-sm text-gray-600">
                Общая стоимость: {plan.totalCost}
            </div>
            <div className="text-sm text-gray-600">
                Ожидаемое количество строк: {plan.totalRows}
            </div>
            <div className="space-y-2">
                {plan.operations.map((operation, index) => (
                    <div key={index}>
                        {renderOperation(operation)}
                    </div>
                ))}
            </div>
        </div>
    );
}; 