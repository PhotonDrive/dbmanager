import * as path from 'path';
import { describe, beforeAll, afterAll, it, expect } from '@jest/globals';
import { SQLOutputValue, StatementResultingChanges, SQLInputValue } from 'node:sqlite';
import { DBManager } from '../src/lib/DBManager';
import * as DBTypes from '../src/types/types';

describe('DBManager Business Tests', () => {
    let instance: DBManager;
    let lastInsertRowid: number | undefined = 0 ;
    beforeAll(() => {
        instance = new DBManager(path.join(__dirname, '../database', 'sample.db'));
    });
    afterAll(() => {
        instance.close();
    });

    it('should create an instance database schema', () => {
        expect(instance).toBeInstanceOf(DBManager);
        expect(instance.getDatabaseFileName()).toBe(path.join(__dirname, '../database', 'sample.db'));
        expect(instance.getDB()).toBeDefined();

        const bppDB: DBTypes.DatabaseSchema = {
            tables: {
                user: {
                    columns: {
                        userid: { type: "INTEGER", primaryKey: true, autoIncrement: true },
                        name: { type: "TEXT", nullable: false },
                        email: { type: "TEXT", nullable: false, unique: true },
                    },
                    foreignKeys: []
                },
                setting: {
                    columns: {
                        settingid: { type: "INTEGER", primaryKey: true, autoIncrement: true },
                        userid: { type: "INTEGER", nullable: false },
                        theme: { type: "TEXT", nullable: true },
                        notifications: { type: "INTEGER", nullable: true }
                    },
                    foreignKeys: [
                        { column: "userid", references: { table: "user", column: "userid" } }
                    ]
                }
            }
        };

        //console.log("Database Schema:", JSON.stringify(bppDB, null, 2));
        instance.initializeDatabase(bppDB);
        const x: Record<string, SQLOutputValue>|undefined = instance.get(`SELECT name FROM sqlite_master WHERE type='table' AND name='user';`);
        expect(x).toBeDefined();
        expect(x?.name).toBe('user');
        const y: Record<string, SQLOutputValue>|undefined = instance.get(`SELECT name FROM sqlite_master WHERE type='table' AND name='setting';`);
        expect(y).toBeDefined();
        expect(y?.name).toBe('setting');
    });

    it('should insert and retrieve data from user tables', () => {
        const insertUserSQL = `INSERT INTO user (name, email) VALUES (?, ?)`;
        const userName = 'John Doe';
        const userEmail = 'john.doe@test.com';
        const result = instance.run(insertUserSQL, [userName, userEmail]);
        expect(result.changes).toBe(1);
        lastInsertRowid = result.lastInsertRowid as number;
        expect(lastInsertRowid).toBeGreaterThan(0);
    });

    it ('should retrieve the inserted user', () => {
        const selectUserSQL = `SELECT * FROM user WHERE userid = ?`;
        const user = instance.get(selectUserSQL, [lastInsertRowid as number]);
        expect(user).toBeDefined();
        expect(user?.name).toBe('John Doe');
        expect(user?.email).toBe('john.doe@test.com');
    });

    it('update the inserted user', () => {
        const updateUserSQL = `UPDATE user SET email = ? WHERE userid = ?`;
        const newEmail = 'junk@test.com';
        const result = instance.run(updateUserSQL, [newEmail, lastInsertRowid as number]);
        expect(result.changes).toBe(1);
    });

    it ('should retrieve the updated user', () => {
        const selectUserSQL = `SELECT * FROM user WHERE userid = ?`;
        const user = instance.get(selectUserSQL, [lastInsertRowid as number]);
        expect(user).toBeDefined();
        expect(user?.name).toBe('John Doe');
        expect(user?.email).toBe('junk@test.com');
    });

    it('insert a setting for the user', () => {
        const insertSettingSQL = `INSERT INTO setting (userid, theme, notifications) VALUES (?, ?, ?)`;
        const theme = 'dark';
        const notifications = 1;
        const result = instance.run(insertSettingSQL, [lastInsertRowid as number, theme, notifications]);
        expect(result.changes).toBe(1);
    });

    it ('should retrieve the inserted setting', () => {
        const selectSettingSQL = `SELECT * FROM setting WHERE userid = ?`;
        const setting = instance.get(selectSettingSQL, [lastInsertRowid as number]);
        expect(setting).toBeDefined();
        expect(setting?.userid).toBe(lastInsertRowid);
        expect(setting?.theme).toBe('dark');
        expect(setting?.notifications).toBe(1);
    });
    
    it('should update the setting for the user', () => {
        const updateSettingSQL = `UPDATE setting SET theme = ?, notifications = ? WHERE userid = ?`;
        const newTheme = 'light';
        const newNotifications = 0;
        const result = instance.run(updateSettingSQL, [newTheme, newNotifications, lastInsertRowid as number]);
        expect(result.changes).toBe(1);
    });

    it ('should delete the setting for the user', () => {
        const deleteSettingSQL = `DELETE FROM setting WHERE userid = ?`;
        const result = instance.run(deleteSettingSQL, [lastInsertRowid as number]);
        expect(result.changes).toBe(1);
        const selectSettingSQL = `SELECT * FROM setting WHERE userid = ?`;
        const setting = instance.get(selectSettingSQL, [lastInsertRowid as number]);
        expect(setting).toBeUndefined();
    });

    it('test function to get database size', () => {
        instance.setPreparedFunction('get-count', (tableName):SQLOutputValue => {
            const row = instance.get(`SELECT COUNT(1) as count FROM ${tableName}`);
            return row ? row.count : 0;
        });
        const pFunction = instance.getPreparedFunction('get-count');
        expect(pFunction).toBeDefined();
        if(pFunction) {
            const userRecordCount:number = pFunction('user') as number; 
            expect(userRecordCount).toBeGreaterThan(0);
            const settingRecordCount:number = pFunction('setting') as number; 
            expect(settingRecordCount).toBe(0);
        }
    });

    it('backup the database', async () => {
        const backupFilePath = path.join(__dirname, '../database', 'sample-backup.db');
        const result = await instance.backupDatabase(backupFilePath);
        expect(result).toBe(true);
    });

    it('delete the inserted user', () => {
        const deleteUserSQL = `DELETE FROM user WHERE userid = ?`;
        const result = instance.run(deleteUserSQL, [lastInsertRowid as number]);
        expect(result.changes).toBe(1);
    });

    it ('should not find the deleted user', () => {
        const selectUserSQL = `SELECT * FROM user WHERE userid = ?`;
        const user = instance.get(selectUserSQL, [lastInsertRowid as number]);
        expect(user).toBeUndefined();
    });

    it('should insert several records, retrieve, and delete data from user table', () => {
        const insertedUserIds: number[] = [];
        const sql:string = `INSERT INTO user (name, email) VALUES (?, ?)`;
        const manyStatements:{sql:string, params: SQLInputValue[]}[] = [
            { sql, params: ['Alice Smith', 'alice.smith@test.com']},
            { sql, params: ['Alice Smith1', 'alice.smith1@test.com']},
            { sql, params: ['Alice Smith2', 'alice.smith2@test.com']},
            { sql, params: ['Alice Smith3', 'alice.smith3@test.com']},
            { sql, params: ['Alice Smith4', 'alice.smith4@test.com']},
            { sql, params: ['Alice Smith5', 'alice.smith5@test.com']},
            { sql, params: ['Bob Johnson', 'bob.johnson@test.com']}
        ];
        const result: StatementResultingChanges[] = instance.runMany(manyStatements);
        expect(result.length).toBe(manyStatements.length);
        result.forEach(element => {
           expect(element.changes).toBe(1);
           insertedUserIds.push(element.lastInsertRowid as number);
        });

        const selectAllUsersSQL = `SELECT * FROM user`;
        const users = instance.getAll(selectAllUsersSQL);
        expect(users.length).toBeGreaterThanOrEqual(manyStatements.length);

        const deleteAllUsersSQL = `DELETE FROM user WHERE userid = ?`;
        const manyDeleteStatements:{sql:string, params: SQLInputValue[]}[] = [];
        insertedUserIds.forEach(element => {
            manyDeleteStatements.push({ sql: deleteAllUsersSQL, params: [element]});
        });
        const deleteResult: StatementResultingChanges[] = instance.runMany(manyDeleteStatements);
        expect(deleteResult.length).toBe(manyDeleteStatements.length);

    });

    it ('should prepare and cache a statement, then use it multiple times, finally deleting them', () => {
        const prepared = instance.setPreparedSQL('insert-user', `INSERT INTO user (name, email) VALUES (?, ?)`);
        expect(prepared).toBe(true);
        const preparedStatement = instance.getPreparedSQL('insert-user');
        expect(preparedStatement).toBeDefined();
        const user1 = ['Prepared User1', 'PreparedUser1' + Math.random().toString(36).substring(7) + '@test.com'];
        const user2 = ['Prepared User2', 'PreparedUser2' + Math.random().toString(36).substring(7) + '@test.com'];
        const user3 = ['Prepared User3', 'PreparedUser3' + Math.random().toString(36).substring(7) + '@test.com'];
        let result = instance.run('insert-user', user1);
        expect(result.changes).toBe(1);
        result = instance.run('insert-user', user2);
        expect(result.changes).toBe(1);
        result = instance.run('insert-user', user3);
        expect(result.changes).toBe(1); 
        expect(result.lastInsertRowid).toBeGreaterThan(0);
        const selectAllUsersSQL = `SELECT * FROM user WHERE name LIKE 'Prepared User%'`;
        const users = instance.getAll(selectAllUsersSQL);
        expect(users.length).toBe(3);
        const deleteAllUsersSQL = `DELETE FROM user WHERE name LIKE 'Prepared User%'`;
        const deleteResult = instance.run(deleteAllUsersSQL);
        expect(deleteResult.changes).toBe(3);
    });

});
