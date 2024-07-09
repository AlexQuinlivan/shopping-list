import { sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { InferSelectModel, sql } from 'drizzle-orm';

export const reminders = sqliteTable('reminders', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  aisle: text('aisle'),
  image: text('image'),
  error: text('error'),
  created_at: text('created_at').notNull(),
  updated_at: text('updated_at').notNull(),
});

export type Reminder = InferSelectModel<typeof reminders>
