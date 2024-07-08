import { exec } from 'child_process';
import { promisify } from 'util';
import { Reminder, db, reminders } from './db/schema';
import { eq, sql } from 'drizzle-orm/sql';

const execAsync = promisify(exec);

interface ReminderResponse {
  results: { aisle: string; items: Reminder[]; }[];
}

interface ReminderFromCLI {
  externalId: string;
  title: string;
}

type AisleReminderPartial = Pick<Reminder, 'aisle' | 'image'>

interface ArticleResponse {
  relevance: number;
  locationDescription: string;
  unknownLocation: boolean;
  aisle: string;
  bay: string;
  shelf: string;
  aisleSide: string;
  bayOffset: number;
  articleNumber: string;
  unitOfMeasure: string;
  articleDescription: string;
  barcode: string;
  articleImageSmallUri: string;
  articleImageMediumUri: string;
  articleImageLargeUri: string;
  standardPrice: number | null;
  promotionalPrice: number | null;
  hasGreatPrice: boolean | null;
  buyFor: number | null;
  buyAnyFor: number | null;
}

interface WoolworthsApiResponse {
  results: ArticleResponse[];
}


async function storeReminders(results: ReminderFromCLI[]): Promise<void> {
  const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString();
  const processQueue: ReminderFromCLI[] = [];

  db.transaction((tx) => {
    const existingReminders =
      tx.select()
        .from(reminders)
        .all();

    // Remove reminders not in the given array
    const remindersIdsArray = results.map(r => r.externalId);
    const remindersToRemove = existingReminders.filter(r => !remindersIdsArray.includes(r.id));
    for (const reminderToRemove of remindersToRemove) {
      tx.delete(reminders)
        .where(eq(reminders.id, reminderToRemove.id))
        .run();
    }

    for (const reminder of results) {
      const existingReminder =
        tx.select()
          .from(reminders)
          .where(eq(reminders.id, reminder.externalId))
          .get();

      if (!existingReminder) {
        tx.insert(reminders)
          .values([{
            id: reminder.externalId,
            name: reminder.title
          }])
          .run();

        processQueue.push(reminder);
      } else if (existingReminder.updated_at! < sixHoursAgo || existingReminder.error || existingReminder.name !== reminder.title) {
        tx.update(reminders)
          .set({
            name: reminder.title,
            updated_at: sql`CURRENT_TIMESTAMP`,
            error: false
          })
          .where(eq(reminders.id, existingReminder.id))
          .run();

        processQueue.push(reminder);
      }
    }
  });

  // Process items added to queue
  let rejected = false;
  for (let index = 0; index < processQueue.length; index++) {
    const reminder = processQueue[index];
    try {
      await processReminder(reminder, db);
    } catch {
      rejected = true;
    }
  }
  if (rejected) {
    console.error("List updated but errors in Woolworths processing.");
  }
}

async function processReminder(reminder: ReminderFromCLI, tx: typeof db): Promise<void> {
  const reminderId = reminder.externalId;
  try {
    const response = await getAisleInfo(reminder.title);

    tx.update(reminders)
      .set({
        aisle: response.aisle,
        image: response.image,
        error: false
      })
      .where(eq(reminders.id, reminder.externalId))
      .run();
  } catch (error) {
    console.error(`Error processing reminder: ${reminder.externalId}`, (error instanceof Error) ? error.message : error);

    tx.update(reminders)
      .set({ error: true })
      .where(eq(reminders.id, reminder.externalId))
      .run();

    throw error;
  }
}

async function getAisleInfo(itemName: string): Promise<AisleReminderPartial> {
  const encodedItemName = encodeURIComponent(itemName);
  const url = `https://mobile-api.woolworths.co.nz/mobile/api/v1/sites/${process.env.STORE_ID}/articles?locationDetail=true&term=${encodedItemName}`;

  const response = await fetch(url, {
    headers: {
      'Host': 'mobile-api.woolworths.co.nz',
      'accept': '*/*',
      'user-agent': 'MyCountdown/6907 CFNetwork/1562 Darwin/24.0.0',
      'accept-language': 'en-NZ,en-AU;q=0.9,en;q=0.8'
    }
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const data: WoolworthsApiResponse = await response.json() as any as WoolworthsApiResponse;

  // Assuming the API returns an array of items and we're interested in the first one
  if (data && data.results && data.results.length > 0) {
    const result = data.results[0]
    return {
      aisle: result.locationDescription || result.aisle,
      image: result.articleImageSmallUri
    };
  }

  return { aisle: 'Unknown', image: null };
}

function transformAndSortResults(results: Reminder[]): { aisle: string; items: Reminder[]; }[] {
  const nonAisles: Record<string, Reminder[]> = {};
  const aisles: Record<number, Reminder[]> = {};

  results.forEach(item => {
    if (item.aisle && /^Aisle \d+$/.test(item.aisle)) {
      const aisleNumber = parseInt(item.aisle.match(/\d+/)![0], 10);
      if (!aisles[aisleNumber]) {
          aisles[aisleNumber] = [];
      }
      aisles[aisleNumber].push(item);
    } else {
      const aisle = item.aisle ?? 'Unknown';
      if (!nonAisles[aisle]) {
          nonAisles[aisle] = [];
      }
      nonAisles[aisle].push(item);
    }
  });

  const sortedNonAisles = Object.keys(nonAisles).sort().map(key => ({
    aisle: key,
    items: nonAisles[key]
  }));

  let unknownGroup: typeof sortedNonAisles | null = null;
  const unknownIndex = sortedNonAisles.findIndex(group => group.aisle === "Unknown");
  if (unknownIndex !== -1) {
    unknownGroup = sortedNonAisles.splice(unknownIndex, 1);
  }

  const sortedAisles = Object.keys(aisles).sort((a: any, b: any) => a - b).map((key: any) => ({
    aisle: `Aisle ${key}`,
    items: aisles[key]
  }));

  return [...sortedNonAisles, ...sortedAisles, ...(unknownGroup ? unknownGroup : [])];
}

export async function getShoppingListItems(): Promise<ReminderResponse> {
  try {
    const { stdout } = await execAsync(`reminders show --format=json Shopping`);
    const remindersFromCLI: ReminderFromCLI[] = JSON.parse(stdout);

    await storeReminders(remindersFromCLI);

    const stored =
      db.select()
        .from(reminders)
        .all();

    const results = transformAndSortResults(stored);

    return {
      results,
    };
  } catch (error) {
    console.error('Error executing AppleScript:', error);
    return {
      results: [],
    };
  }
}


