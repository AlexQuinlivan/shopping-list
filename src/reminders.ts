import { exec } from 'child_process';
import { promisify } from 'util';
import { reminders } from './db/schema';
import { eq, inArray, not, sql } from 'drizzle-orm/sql';
import { db } from './db/db';
import { ProcessedReminder, ReminderFromCLI } from './types';
import { locateProduct } from './locateProduct';
import { HTTPError } from './error';

const execAsync = promisify(exec);

export async function remindersFromCLI(): Promise<ReminderFromCLI[]> {
  const { stdout } = await execAsync(`reminders show --format=json ${process.env.SHOPPING_LIST_NAME}`);
  return JSON.parse(stdout);
}

export async function storeReminders(results: ReminderFromCLI[]): Promise<void> {
  const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000);
  const processQueue: ReminderFromCLI[] = [];

  db.transaction((tx) => {
    // Remove reminders not in the given array
    tx.delete(reminders)
      .where(not(inArray(reminders.id, results.map(r => r.externalId))))
      .run();

    // Store new reminders and update existing ones, then add them to the process queue if needed
    for (const reminder of results) {
      const existingReminder =
        tx.select()
          .from(reminders)
          .where(eq(reminders.id, reminder.externalId))
          .get();

      if (!existingReminder) {
        const now = new Date().toISOString();
        tx.insert(reminders)
          .values([{
            id: reminder.externalId,
            name: reminder.title,
            created_at: now,
            updated_at: now
          }])
          .run();

        processQueue.push(reminder);
      } else if (new Date(existingReminder.updated_at) < sixHoursAgo
        || (existingReminder.error && existingReminder.error !== '404')
        || existingReminder.name !== reminder.title) {

        // Update the title if it has changed
        if (existingReminder.name !== reminder.title) {
          tx.update(reminders)
            .set({ name: reminder.title, updated_at: new Date().toISOString() })
            .where(eq(reminders.id, existingReminder.id))
            .run();
        }

        processQueue.push(reminder);
      }
    }
  });

  // Process items added to queue
  let rejected = false;
  const processed: ProcessedReminder[] = [];
  for (const reminder of processQueue) {
    try {
      processed.push(
        await processReminder(reminder)
      );
    } catch {
      rejected = true;
    }
  }
  if (rejected) {
    console.error("List updated but errors in Woolworths processing.");
  }

  // Update the reminders with their processed data
  if (processed.length) {
    db.transaction(tx => {
      for (const processedReminder of processed) {
        if ('error' in processedReminder) {
          tx.update(reminders)
            .set({ error: processedReminder.error, updated_at: new Date().toISOString() })
            .where(eq(reminders.id, processedReminder.id))
            .run();
        } else {
          tx.update(reminders)
            .set({
              aisle: processedReminder.aisle,
              image: processedReminder.image,
              error: null,
              updated_at: new Date().toISOString()
            })
            .where(eq(reminders.id, processedReminder.id))
            .run();
        }
      }
    });
  } else {
    console.log("No new items to process.");
  }
}

async function processReminder(reminder: ReminderFromCLI): Promise<ProcessedReminder> {
  try {
    const response = await locateProduct(reminder.title);

    return {
      id: reminder.externalId,
      aisle: response.aisle!,
      image: response.image!,
    };
  } catch (error) {
    console.error(`Error processing reminder: ${reminder.externalId}`, (error instanceof Error) ? error.message : error);

    return {
      id: reminder.externalId,
      error: (error instanceof HTTPError) ? `${error.status}` : 'unknown',
    }
  }
}
