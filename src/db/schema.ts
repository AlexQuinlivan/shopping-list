import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { InferSelectModel, sql } from 'drizzle-orm';

const sqlite = new Database('reminders.db');
export const db = drizzle(sqlite);
  
export const reminders = sqliteTable('reminders', {
  id: text('id').primaryKey(),
  name: text('name', 'text').notNull(),
  aisle: text('aisle', 'text'),
  image: text('image', 'text'),
  error: integer('error', { mode: 'boolean' }).default(false),
  created_at: text('created_at').default(sql`CURRENT_TIMESTAMP`),
  updated_at: text('updated_at').default(sql`CURRENT_TIMESTAMP`),
});

export type Reminder = InferSelectModel<typeof reminders>
