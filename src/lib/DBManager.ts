
import { backup, DatabaseSync, StatementSync, SQLInputValue, SQLOutputValue, StatementResultingChanges } from 'node:sqlite';
import * as DBTypes from '../types/types';

export class DBManager {
    db: DatabaseSync;
    databaseFileName: string = './database/sample.db';
    preparedStatements: DBTypes.Prepared = {};
    preparedFunctions: DBTypes.DBFunction = {};

    constructor(databaseFileName: string = './sample.db') {
        this.databaseFileName = databaseFileName;
        this.db = new DatabaseSync(this.databaseFileName);
    }

    close() {
        if (this.db.isOpen) {
            this.db.close();
        }
    }

    getDB() {
        return this.db;
    }

    getDatabaseFileName() {
        return this.databaseFileName;
    }

    execute(sql: string): void {
        if (this.db.isOpen) {
            try {
                //console.log("Executing SQL:", sql);
                this.db.exec(sql);
            } catch (error) {
                console.error("SQL execution error:", error);
                throw error;
            }
        } else {
            throw new Error("Database is not open.");
        }
    }

    run(sql: string, params: SQLInputValue[] = []): StatementResultingChanges {
        if (this.db.isOpen) {
            try {
                let targetStatement:StatementSync | undefined = this.preparedStatements[sql];
                if (!targetStatement) { 
                    targetStatement = this.db.prepare(sql);
                }
                return targetStatement.run(...params);
            } catch (error) {
                console.error("SQL execution error:", error);
                throw error;
            }
        } else {
            throw new Error("Database is not open.");
        }   
    }

    runMany(manyStatements:{sql:string, params: SQLInputValue[]}[]): StatementResultingChanges[] {
        const returnValues: StatementResultingChanges[] = [];
        if (this.db.isOpen) {
            try {
                manyStatements.forEach((sqlElement:{sql:string, params: SQLInputValue[]}) => {
                    let targetStatement:StatementSync | undefined = this.preparedStatements[sqlElement.sql];
                    if (!targetStatement) { 
                        targetStatement = this.db.prepare(sqlElement.sql);
                    }
                    returnValues.push(targetStatement.run(...sqlElement.params));
                });
                return returnValues;
            } catch (error) {
                console.error("SQL execution error:", error);
                throw error;
            }
        } else {
            throw new Error("Database is not open.");
        }   
    }

    getAll(sql: string, params: SQLInputValue[] = []):Record<string, SQLOutputValue>[] | undefined[] {
        if (this.db.isOpen) {
            try {
                const stmt = this.db.prepare(sql);
                return stmt.all(...params);
            } catch (error) {
                console.error("SQL execution error:", error);
                throw error;
            }
        } else {
            throw new Error("Database is not open.");
        }
    }

    get(sql: string, params: SQLInputValue[] = []):Record<string, SQLOutputValue> | undefined {
        if (this.db.isOpen) {
            try {
                const stmt = this.db.prepare(sql);
                return stmt.get(...params);
            } catch (error) {
                console.error("SQL execution error:", error);
                throw error;
            }
        } else {
            throw new Error("Database is not open.");
        }
    }

    setPreparedSQL(sqlKey: string, sql: string): boolean {
        if (this.db.isOpen) {
            try {
                this.preparedStatements[sqlKey] = this.db.prepare(sql);
                return true;
            } catch (error) {
                console.error("SQL preparation error:", error);
                throw error;
            }
        } else {
            throw new Error("Database is not open.");
        }
        return false;
    }

    getPreparedSQL(sqlKey: string): StatementSync | null {
        return this.preparedStatements[sqlKey] || null;
    }

    setPreparedFunction(functionName: string, func: (...args: SQLInputValue[]) => SQLOutputValue): boolean {
        if (this.db.isOpen) {
            try {
                this.db.function(functionName, func);
                this.preparedFunctions[functionName] = func;
                return true;
            } catch (error) {
                console.error("Function preparation error:", error);
                throw error;
            }
        } else {
            throw new Error("Database is not open.");
        }
        return false;
    }

    getPreparedFunction(functionName: string): ((...args: SQLInputValue[]) => SQLOutputValue) | null {
        return this.preparedFunctions[functionName] || null;
    }

    async createTables(schema: DBTypes.TableSchema): Promise<string[]> {
        const createStatements: string[] = [];

        for (const tableName in schema) {
            if (Object.prototype.hasOwnProperty.call(schema, tableName)) {
                const tableDefinition = schema[tableName];
                const columnDefinitions: string[] = [];

                // Add column definitions
                for (const columnName in tableDefinition?.columns) {
                    if (Object.prototype.hasOwnProperty.call(tableDefinition.columns, columnName)) {
                        if (typeof tableDefinition.columns[columnName] === 'object') {
                            const columnDefination = tableDefinition.columns[columnName] as { type: string, primaryKey?: boolean, autoIncrement?: boolean, nullable?: boolean, unique?: boolean };
                            let columnDefinationString = `${columnName} ${columnDefination.type}`; 
                            if (columnDefination.primaryKey) columnDefinationString += ' PRIMARY KEY';
                            if (columnDefination.autoIncrement) columnDefinationString += ' AUTOINCREMENT';
                            if (columnDefination.nullable === false) columnDefinationString += ' NOT NULL';
                            if (columnDefination.unique) columnDefinationString += ' UNIQUE';
                            columnDefinitions.push(columnDefinationString);
                        } else {    
                            columnDefinitions.push(`${columnName} ${tableDefinition.columns[columnName]} `);
                        }
                    }
                }
                // Construct the basic CREATE TABLE statement
                let createTableSql = `CREATE TABLE IF NOT EXISTS ${tableName} (\n    ${columnDefinitions.join(',\n    ')}\n)`;

                // Add foreign key constraints if they exist
                if (tableDefinition?.foreignKeys && tableDefinition.foreignKeys.length > 0) {
                    const foreignKeyConstraints: string[] = [];
                    tableDefinition.foreignKeys.forEach(fk => {
                        foreignKeyConstraints.push(
                            `FOREIGN KEY (${fk.column}) REFERENCES ${fk.references.table}(${fk.references.column})`
                        );
                    });
                    createTableSql = `${createTableSql.slice(0, -1)},\n    ${foreignKeyConstraints.join(',\n    ')}\n)`;
                }

                createStatements.push(createTableSql);
            }
        }
        return createStatements;
    }

    async createIndex(
        indexName: string,
        indexDetails: DBTypes.IndexSchema[string]
    ): Promise<string> {
        const { table, columns, unique } = indexDetails;
        console.log(`Attempting to create index '${indexName}' on table '${table}'`);
        console.log(`Columns: ${columns.join(', ')}`);
        console.log(`Unique: ${unique ? 'Yes' : 'No'}`);
        // Simulate database interaction
        console.log(`Index '${indexName}' created successfully (simulated).`);
        return `CREATE ${unique ? 'UNIQUE' : ''} INDEX ${indexName} ON ${table} (${columns.join(', ')})`;
    }

    async applyIndexes(indexes: DBTypes.IndexSchema): Promise<string[]> {
        const createStatements: string[] = [];
        for (const indexName in indexes) {
            if (Object.prototype.hasOwnProperty.call(indexes, indexName)) {
                const indexDetails = indexes[indexName];
                if (indexDetails?.table && indexDetails.columns.length > 0) {
                    createStatements.push(await this.createIndex(indexName, indexDetails));
                }
            }
        }
        return createStatements;
    }

    async initializeDatabase(schema: DBTypes.DatabaseSchema): Promise<boolean> {
        if (this.db.isOpen) {
            try {
                if (schema.tables) {
                    const tableStatements = await this.createTables(schema.tables);
                    tableStatements.forEach(stmt => this.execute(stmt));
                }
                if (schema.indexes) {
                    const indexStatements = await this.applyIndexes(schema.indexes);
                    indexStatements.forEach(stmt => this.execute(stmt));
                }
                if (schema.views) {
                    for (const viewName in schema.views) {
                        if (Object.prototype.hasOwnProperty.call(schema.views, viewName)) {
                            const viewSql = schema.views[viewName];
                            this.execute(`CREATE VIEW ${viewName} AS ${viewSql}`);
                        }
                    }
                }
                return true;
            } catch (error) {
                console.error("Database initialization error:", error);
                throw error;
            }
        } else {
            throw new Error("Database is not open.");
        }
        return false;
    }

    async backupDatabase(backupFilePath: string): Promise<boolean> {
        if (this.db.isOpen) {
            await backup(this.db, backupFilePath, {
                rate: 1, // Copy one page at a time.
                progress: ({ totalPages, remainingPages }) => {
                    console.log('Backup in progress', { totalPages, remainingPages });
                },
            }).catch((err) => {
                console.error("Backup failed:", err);
                throw err;
            });
            return true;
        } else {
            throw new Error("Database is not open.");
        }
        return false;
    }
}
