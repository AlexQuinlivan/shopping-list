import { sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { InferSelectModel, sql } from 'drizzle-orm';

export const reminders = sqliteTable('reminders', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  aisle: text('aisle'),
  image: text('image'),
  error: text('error'),
  created_at: text('created_at').default(sql`CURRENT_TIMESTAMP`),
  updated_at: text('updated_at').default(sql`CURRENT_TIMESTAMP`),
});

export type Reminder = InferSelectModel<typeof reminders>
