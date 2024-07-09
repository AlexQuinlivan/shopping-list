import type { Reminder } from "./db/schema";

// Reminders

export type ApiResponse<T> = T | {
  error: string;
}

export type ShoppingListResponse = ApiResponse<{ results: ReminderGroup[]; }>;

export type ReminderGroup = {
  aisle: string;
  items: Reminder[];
};

export type ReminderFromCLI = {
  externalId: string;
  title: string;
};

export type AisleReminderPartial = Pick<Reminder, 'aisle' | 'image'>;

export type ProcessedReminder = {
  id: string;
} & ({
  aisle: string;
  image: string;
} | {
  error: `${number}` | 'image' | 'unknown';
});

// Woolworths

export type WoolworthsArticle = {
  relevance: number;
  locationDescription: string;
  unknownLocation: boolean;
  aisle: string | null;
  bay: string | null;
  shelf: string | null;
  aisleSide: string | null;
  bayOffset: number | null;
  articleNumber: string | null;
  unitOfMeasure: string | null;
  articleDescription: string | null;
  barcode: string | null;
  articleImageSmallUri: string;
  articleImageMediumUri: string;
  articleImageLargeUri: string;
  standardPrice: number | null;
  promotionalPrice: number | null;
  hasGreatPrice: boolean | null;
  buyFor: number | null;
  buyAnyFor: number | null;
};

export type WoolworthsArticlesResponse = {
  results: WoolworthsArticle[];
};
