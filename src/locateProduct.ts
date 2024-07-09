import { HTTPError } from "./error";
import { AisleReminderPartial, WoolworthsArticlesResponse } from "./types";

/**
 * Fetches the aisle information and image URL for a given product item using the Woolworths API.
 * @param itemName - The name of the product item.
 * @returns A promise that resolves to an object containing the aisle information and image URL.
 */
export async function locateProduct(itemName: string): Promise<AisleReminderPartial> {
  const encodedItemName = encodeURIComponent(itemName);
  const url = `https://mobile-api.woolworths.co.nz/mobile/api/v1/sites/${process.env.STORE_ID}/articles?locationDetail=true&term=${encodedItemName}`;

  console.log(`Fetching aisle info for '${itemName}'`);
  const response = await fetch(url, {
    headers: {
      'Host': 'mobile-api.woolworths.co.nz',
      'accept': '*/*',
      'user-agent': 'MyCountdown/6907 CFNetwork/1562 Darwin/24.0.0',
      'accept-language': 'en-NZ,en-AU;q=0.9,en;q=0.8'
    }
  });

  if (!response.ok) {
    throw new HTTPError(response.status);
  }

  const data = await response.json() as WoolworthsArticlesResponse;

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
