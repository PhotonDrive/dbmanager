//import { DatabaseSync, SQLInputValue, SQLOutputValue } from 'node:sqlite';
//import * as DBTypes from '../src/types/types';
import { DBManager } from '../src/lib/DBManager';
import {describe, expect, it, beforeEach} from '@jest/globals';

describe('DBManager Tests', () => {
  let instance:DBManager;

  beforeEach(() => {
    instance = new DBManager();
  });

  it('instance should be an instanceof DBManager', () => {
    expect(instance instanceof DBManager).toBeTruthy();
  });

  it('should have a method close()', () => {
    expect(instance.close).toBeTruthy();
  });

  it('should have a method getDB()', () => {
    expect(instance.getDB).toBeTruthy();
  });

  it('should have a method getDatabaseFileName()', () => {
    expect(instance.getDatabaseFileName).toBeTruthy();
  });

  it('should have a method execute()', () => {
    expect(instance.execute).toBeTruthy();
  });

  it('should have a method getAll()', () => {
    // instance.getAll(sql,params);
    expect(instance.getAll).toBeTruthy();
  });

  it('should have a method get()', () => {
    // instance.get(sql,params);
    expect(instance.get).toBeTruthy();
  });

  it('should have a method setPreparedSQL()', () => {
    // instance.setPreparedSQL(sqlKey,sql);
    expect(instance.setPreparedSQL).toBeTruthy();
  });

  it('should have a method getPreparedSQL()', () => {
    // instance.getPreparedSQL(sqlKey);
    expect(instance.getPreparedSQL).toBeTruthy();
  });

  it('should have a method setPreparedFunction()', () => {
    // instance.setPreparedFunction(functionName,func);
    expect(instance.setPreparedFunction).toBeTruthy();
  });

  it('should have a method getPreparedFunction()', () => {
    // instance.getPreparedFunction(functionName);
    expect(instance.getPreparedFunction).toBeTruthy();
  });

  it('should have a method createTables()', async () => {
    // await instance.createTables(schema);
    expect(instance.createTables).toBeTruthy();
  });

  it('should have a method createIndex()', async () => {
    // await instance.createIndex(indexName,indexDetails);
    expect(instance.createIndex).toBeTruthy();
  });

  it('should have a method applyIndexes()', async () => {
    // await instance.applyIndexes(indexes);
    expect(instance.applyIndexes).toBeTruthy();
  });

  it('should have a method initializeDatabase()', async () => {
    // await instance.initializeDatabase(schema);
    expect(instance.initializeDatabase).toBeTruthy();
  });
});
