import express from 'express';
import { getShoppingListItems } from './reminders';

const app = express();
const port = 9090;

app.get('/api/shopping-list', async (req, res) => {
  try {
    const items = await getShoppingListItems();
    res.json(items);
  } catch (error) {
    console.error('Error fetching shopping list:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});

