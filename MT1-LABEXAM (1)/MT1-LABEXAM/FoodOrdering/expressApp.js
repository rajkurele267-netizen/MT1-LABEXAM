import express from 'express';

const app = express();
const PORT = 4000;

app.use(express.json());

const foods = [
  { id: 1, foodName: 'Pizza', category: 'Fast Food', price: 250, availability: true },
  { id: 2, foodName: 'Burger', category: 'Fast Food', price: 150, availability: true },
  { id: 3, foodName: 'Pasta', category: 'Italian', price: 200, availability: false },
];

const isPositiveNumber = (value) => typeof value === 'number' && Number.isFinite(value) && value > 0;

const isMissing = (value) => value === undefined || value === null || value === '';

// Returns an error message, or null when the food data is valid
const validateFood = (data, requireId) => {
  if (!data || typeof data !== 'object' || Array.isArray(data)) return 'Request body must be a JSON object';
  const fields = requireId ? ['id', 'foodName', 'category', 'price', 'availability'] : ['foodName', 'category', 'price', 'availability'];
  const missing = fields.filter((field) => isMissing(data[field]));
  if (missing.length > 0) return `Missing required fields: ${missing.join(', ')}`;
  if (!isPositiveNumber(data.price)) return 'Price must be a positive number';
  if (typeof data.availability !== 'boolean') return 'Availability must be true or false';
  return null;
};

// GET all foods
app.get('/foods', (req, res) => {
  res.json(foods);
});

// GET food by id
app.get('/foods/:id', (req, res) => {
  const food = foods.find((item) => item.id === Number(req.params.id));
  if (!food) return res.status(404).json({ error: 'Food item not found' });
  res.json(food);
});

// POST add food
app.post('/foods', (req, res) => {
  const errorMessage = validateFood(req.body, true);
  if (errorMessage) return res.status(400).json({ error: errorMessage });

  if (foods.some((item) => item.id === req.body.id)) {
    return res.status(400).json({ error: 'A food item with this id already exists' });
  }

  const { id, foodName, category, price, availability } = req.body;
  const newFood = { id, foodName, category, price, availability };
  foods.push(newFood);
  res.status(201).json({ message: 'Food item added successfully', food: newFood });
});

// PUT update food
app.put('/foods/:id', (req, res) => {
  const food = foods.find((item) => item.id === Number(req.params.id));
  if (!food) return res.status(404).json({ error: 'Food item not found' });

  const errorMessage = validateFood(req.body, false);
  if (errorMessage) return res.status(400).json({ error: errorMessage });

  const { foodName, category, price, availability } = req.body;
  Object.assign(food, { foodName, category, price, availability });
  res.json({ message: 'Food item updated successfully', food });
});

// DELETE food
app.delete('/foods/:id', (req, res) => {
  const index = foods.findIndex((item) => item.id === Number(req.params.id));
  if (index === -1) return res.status(404).json({ error: 'Food item not found' });

  const [deletedFood] = foods.splice(index, 1);
  res.json({ message: 'Food item deleted successfully', food: deletedFood });
});

// Invalid routes
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Invalid JSON and other errors
app.use((err, req, res, next) => {
  if (err.type === 'entity.parse.failed') return res.status(400).json({ error: 'Invalid JSON' });
  res.status(500).json({ error: 'Internal Server Error' });
});

app.listen(PORT, () => {
  console.log(`Express Server running at http://localhost:${PORT}`);
});
