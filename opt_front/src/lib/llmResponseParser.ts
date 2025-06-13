import { QueryPlanResult, Operation } from '../types/ast';

export interface ParsedLLMResponse {
    originalQuery: string;
    optimizedQuery: string;
    optimizationRationale: string;
    performanceImpact: string;
    potentialRisks: string;
    originalPlan: QueryPlanResult | null;
    optimizedPlan: QueryPlanResult | null;
    tablesMetadata: Record<string, any> | null;
}

export function parseLLMResponse(text: string): ParsedLLMResponse {
    const response: ParsedLLMResponse = {
        originalQuery: '',
        optimizedQuery: '',
        optimizationRationale: '',
        performanceImpact: '',
        potentialRisks: '',
        originalPlan: null,
        optimizedPlan: null,
        tablesMetadata: null
    };

    // Извлекаем исходный запрос
    const originalQueryMatch = text.match(/Исходный запрос\s*```sql\s*([\s\S]*?)\s*```/);
    if (originalQueryMatch) {
        response.originalQuery = originalQueryMatch[1].trim();
    }

    // Извлекаем оптимизированный запрос
    const optimizedQueryMatch = text.match(/Оптимизированный запрос\s*```sql\s*([\s\S]*?)\s*```/);
    if (optimizedQueryMatch) {
        response.optimizedQuery = optimizedQueryMatch[1].trim();
    } else {
        // Если не нашли в специальном разделе, ищем в тексте
        const sqlMatch = text.match(/```sql\s*([\s\S]*?)\s*```/);
        if (sqlMatch) {
            response.optimizedQuery = sqlMatch[1].trim();
        }
    }

    // Если оптимизированный запрос не найден, используем исходный
    if (!response.optimizedQuery) {
        response.optimizedQuery = response.originalQuery;
    }

    // Извлекаем обоснование оптимизации
    const rationaleMatch = text.match(/Обоснование оптимизации\s*([\s\S]*?)(?=##|$)/);
    if (rationaleMatch) {
        response.optimizationRationale = rationaleMatch[1].trim();
    }

    // Извлекаем оценку улучшения
    const impactMatch = text.match(/Оценка улучшения\s*([\s\S]*?)(?=##|$)/);
    if (impactMatch) {
        response.performanceImpact = impactMatch[1].trim();
    }

    // Извлекаем потенциальные риски
    const risksMatch = text.match(/Потенциальные риски\s*([\s\S]*?)(?=##|$)/);
    if (risksMatch) {
        response.potentialRisks = risksMatch[1].trim();
    }

    // Извлекаем планы выполнения
    const originalPlanMatch = text.match(/План исходного запроса\s*```sql\s*([\s\S]*?)\s*```/);
    if (originalPlanMatch) {
        response.originalPlan = parseQueryPlan(originalPlanMatch[1].trim());
    }

    const optimizedPlanMatch = text.match(/План оптимизированного запроса\s*```sql\s*([\s\S]*?)\s*```/);
    if (optimizedPlanMatch) {
        response.optimizedPlan = parseQueryPlan(optimizedPlanMatch[1].trim());
    }

    // Извлекаем метаданные таблиц
    const metadataMatch = text.match(/Метаданные таблиц\s*```json\s*([\s\S]*?)\s*```/);
    if (metadataMatch) {
        try {
            response.tablesMetadata = JSON.parse(metadataMatch[1].trim());
        } catch (e) {
            console.error('Ошибка при парсинге метаданных таблиц:', e);
        }
    }

    return response;
}

export function parseQueryPlan(text: string): QueryPlanResult {
    const operations: Operation[] = [];
    let currentOperation: Operation | null = null;

    const lines = text.split('\n');
    for (const line of lines) {
        const trimmedLine = line.trim();
        if (!trimmedLine) continue;

        const content = trimmedLine;

        // Если это новая операция (начинается с -> или с типа операции)
        if (content.startsWith('->') || /^(Seq Scan|Index Scan|Nested Loop|Hash Join|Sort|Aggregate|Limit)/.test(content)) {
            if (currentOperation) {
                operations.push(currentOperation);
            }

            currentOperation = {
                type: content.replace('->', '').trim(),
                tableName: undefined,
                statistics: { cost: '0', rows: '0', width: '0' },
                keys: [],
                conditions: [],
                metadata: {},
                additionalInfo: []
            };

            // Извлекаем имя таблицы, если есть
            const tableMatch = content.match(/on\s+(\w+)/i);
            if (tableMatch && currentOperation) {
                currentOperation.tableName = tableMatch[1];
            }
        } else if (currentOperation) {
            // Добавляем информацию к текущей операции
            if (content.includes('cost=')) {
                const costMatch = content.match(/cost=(\d+\.\d+)\.\.(\d+\.\d+)/);
                if (costMatch) {
                    currentOperation.statistics.cost = costMatch[2];
                }
            }
            if (content.includes('rows=')) {
                const rowsMatch = content.match(/rows=(\d+)/);
                if (rowsMatch) {
                    currentOperation.statistics.rows = rowsMatch[1];
                }
            }
            if (content.includes('width=')) {
                const widthMatch = content.match(/width=(\d+)/);
                if (widthMatch) {
                    currentOperation.statistics.width = widthMatch[1];
                }
            }
            if (content.includes('Index Cond:')) {
                currentOperation.conditions.push(content.replace('Index Cond:', '').trim());
            }
            if (content.includes('Filter:')) {
                currentOperation.conditions.push(content.replace('Filter:', '').trim());
            }
            if (content.includes('Key:')) {
                currentOperation.keys.push(content.replace('Key:', '').trim());
            }
        }
    }

    // Добавляем последнюю операцию
    if (currentOperation) {
        operations.push(currentOperation);
    }

    const totalCost = operations.reduce((sum, op) => sum + parseFloat(op.statistics.cost), 0).toString();
    const totalRows = operations.reduce((sum, op) => sum + parseFloat(op.statistics.rows), 0).toString();

    return {
        operations,
        cost: parseFloat(totalCost),
        planningTimeMs: 0,
        executionTimeMs: 0,
        totalCost,
        totalRows
    };
}

export const getPromptTemplate = (
    isMPP: boolean,
    hasConnection: boolean
): string => {
    if (isMPP && hasConnection) {
        return `Задача
Ты — специалист по оптимизации SQL-запросов в MPP-системах, включая Greenplum. Твоя цель — переписать SQL-запрос так, чтобы он выполнялся быстрее и использовал меньше ресурсов, без изменения логики и без вмешательства в СУБД.

Входные данные SQL-запрос:
{query_text}
План выполнения (EXPLAIN): {query_plan}
Метаданные таблиц: {tables_meta}

Выходные данные
Оптимизированный SQL-запрос:
{optimized_query}
Обоснование изменений:
Кратко опиши, какие узкие места были найдены в плане запроса, и какие методы оптимизации применены.
Оценка улучшения:
Примерное снижение времени выполнения или факторы, которые повлияют на производительность.
Потенциальные риски:
Возможные побочные эффекты изменений, если таковые имеются.`;
    } else if (isMPP && !hasConnection) {
        return `Задача
Ты — специалист по оптимизации SQL-запросов в MPP-системах, включая Greenplum. Твоя цель — переписать SQL-запрос так, чтобы он выполнялся быстрее и использовал меньше ресурсов, без изменения логики и без вмешательства в СУБД.

Входные данные SQL-запрос:
{query_text}

Выходные данные
Оптимизированный SQL-запрос:
{optimized_query}
Обоснование изменений:
Кратко опиши, какие методы оптимизации применены и почему.
Оценка улучшения:
Примерное снижение времени выполнения или факторы, которые повлияют на производительность.
Потенциальные риски:
Возможные побочные эффекты изменений, если таковые имеются.`;
    } else if (!isMPP && hasConnection) {
        return `Задача
Ты — специалист по оптимизации SQL-запросов в PostgreSQL. Твоя цель — переписать SQL-запрос так, чтобы он выполнялся быстрее и использовал меньше ресурсов, без изменения логики и без вмешательства в СУБД.

Входные данные SQL-запрос:
{query_text}
План выполнения (EXPLAIN): {query_plan}
Метаданные таблиц: {tables_meta}

Выходные данные
Оптимизированный SQL-запрос:
{optimized_query}
Обоснование изменений:
Кратко опиши, какие узкие места были найдены в плане запроса, и какие методы оптимизации применены.
Оценка улучшения:
Примерное снижение времени выполнения или факторы, которые повлияют на производительность.
Потенциальные риски:
Возможные побочные эффекты изменений, если таковые имеются.`;
    } else {
        return `Задача
Ты — специалист по оптимизации SQL-запросов в PostgreSQL. Твоя цель — переписать SQL-запрос так, чтобы он выполнялся быстрее и использовал меньше ресурсов, без изменения логики и без вмешательства в СУБД.

Входные данные SQL-запрос:
{query_text}

Выходные данные
Оптимизированный SQL-запрос:
{optimized_query}
Обоснование изменений:
Кратко опиши, какие методы оптимизации применены и почему.
Оценка улучшения:
Примерное снижение времени выполнения или факторы, которые повлияют на производительность.
Потенциальные риски:
Возможные побочные эффекты изменений, если таковые имеются.`;
    }
}; 