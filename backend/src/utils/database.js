import sqlite3 from "sqlite3";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const backendDir = path.resolve(__dirname, "../..");
const dbPath = path.join(backendDir, "db", "smartfarm.db");
const initSqlPath = path.join(backendDir, "db", "init.sql");

export const db = new sqlite3.Database(dbPath);

export const run = (sql, params = []) =>
  new Promise((resolve, reject) => {
    db.run(sql, params, function (error) {
      if (error) reject(error);
      else resolve({ id: this.lastID, changes: this.changes });
    });
  });

export const get = (sql, params = []) =>
  new Promise((resolve, reject) => {
    db.get(sql, params, (error, row) => (error ? reject(error) : resolve(row)));
  });

export const all = (sql, params = []) =>
  new Promise((resolve, reject) => {
    db.all(sql, params, (error, rows) =>
      error ? reject(error) : resolve(rows),
    );
  });

const exec = (sql) =>
  new Promise((resolve, reject) => {
    db.exec(sql, (error) => (error ? reject(error) : resolve()));
  });

export async function initialiseDatabase() {
  const sql = await fs.readFile(initSqlPath, "utf8");
  await exec(sql);
}
