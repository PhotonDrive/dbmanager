import { StatementSync, SQLInputValue, SQLOutputValue } from 'node:sqlite';
export interface Prepared {
    [statementKey: string]: StatementSync;
}

export interface DBFunction {
    [statementKey: string]: (...args: SQLInputValue[]) => SQLOutputValue;
}

export interface TableSchema {
    [tableName: string]: {
        columns: {
            [columnName: string]: { type: string, primaryKey?: boolean, autoIncrement?: boolean, nullable?: boolean, unique?: boolean } | string;
        };
        foreignKeys?: {
            column: string;                 // column in this table
            references: {
                table: string;              // referenced table
                column: string;             // referenced column
            };
        }[];
    };
}

export interface ViewSchema {
    [viewName: string]: string;
}

export interface IndexSchema {
    [indexName: string]: {
        table: string;          // table on which the index is created
        columns: string[];      // columns included in the index
        unique?: boolean;       // whether the index is unique
    };
}

export interface DatabaseSchema {
    tables?: TableSchema;
    views?: ViewSchema;
    indexes?: IndexSchema;
}

/*
export interface DBResult {
    rowsAffected?: number;
    lastAffectedRowId?: number;
    retrievedRows?: any[];
    additionalInfo?: any;
    timestamp?: string;
    durationMs?: number;
}

export interface DBError {
    message: string;
    code?: string;
    details?: any;
}

export interface DBRequest {
    messageType: string;
    requestId: string;
    sql?: string;
    parameters?: any[];
}

export interface DBResponse {
    request: DBRequest;
    success: boolean;
    result: DBResult;
    error?: DBError;
}
*/
