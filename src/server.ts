import express, { type Response } from 'express';
import { shoppingList } from './shoppingList';
import { ShoppingListResponse } from './types';

const app = express();
const port = process.env.PORT;

app.get('/api/shopping-list', async (_req, res: Response<ShoppingListResponse>) => {
  try {
    // No, this is not idempotent, even in the slightest. There couldn't be more side effects.
    const items = await shoppingList();
    res.json(items);
  } catch (error) {
    console.error('Error fetching shopping list:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});

