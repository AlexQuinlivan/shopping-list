import { db } from "./db/db";
import { Reminder, reminders } from "./db/schema";
import { remindersFromCLI, storeReminders } from "./reminders";
import { ReminderGroup, ShoppingListResponse } from "./types";

export async function shoppingList(): Promise<ShoppingListResponse> {
  try {
    // Load reminders from EventKit using a CLI tool
    const cliReminders = await remindersFromCLI();

    // Persist the loaded reminders to the local sqlite db
    await storeReminders(cliReminders);

    // Load ALL of the stored reminders
    const stored =
      db.select()
        .from(reminders)
        .all();

    // Transform the stored reminders into a grouped and sorted list
    const results = groupAndSortReminders(stored);

    return {
      results,
    };
  } catch (error) {
    console.error('Error executing loading shopping list:', error);
    return {
      results: [],
    };
  }
}

/**
 * Groups and sorts the reminders based on their aisle numbers / location.
 * Non-aisle/location-only reminders are grouped together and sorted alphabetically.
 * Aisle reminders are grouped together and sorted numerically.
 * If there are reminders with unknown aisles, they are placed in a separate group,
 * appended to the result set.
 *
 * @param results - An array of unsorted Reminder rows.
 * @returns An array of ReminderGroup objects, where each group contains a sorted list of reminders.
 */
function groupAndSortReminders(results: Reminder[]): ReminderGroup[] {
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

  const sortedAisles = Object.keys(aisles).sort((a, b) => parseInt(a) - parseInt(b)).map(key => ({
    aisle: `Aisle ${key}`,
    items: aisles[parseInt(key)]
  }));

  return [...sortedNonAisles, ...sortedAisles, ...(unknownGroup ? unknownGroup : [])];
}