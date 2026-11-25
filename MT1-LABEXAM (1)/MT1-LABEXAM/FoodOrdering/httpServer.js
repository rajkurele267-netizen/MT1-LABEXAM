import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const PORT = 3000;
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// In-memory food records (no database)
const foods = [
  { id: 1, foodName: 'Pizza', category: 'Fast Food', price: 250, availability: true },
  { id: 2, foodName: 'Burger', category: 'Fast Food', price: 150, availability: true },
  { id: 3, foodName: 'Pasta', category: 'Italian', price: 200, availability: false },
];

const REQUIRED_FIELDS = ['id', 'foodName', 'category', 'price', 'availability'];

const sendJson = (res, statusCode, data) => {
  res.writeHead(statusCode, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data, null, 2));
};

const sendHtml = (res, statusCode, html) => {
  res.writeHead(statusCode, { 'Content-Type': 'text/html' });
  res.end(html);
};

const server = http.createServer((req, res) => {
  const { method } = req;
  const pathname = new URL(req.url, `http://${req.headers.host}`).pathname;

  // GET /
  if (method === 'GET' && pathname === '/') {
    return sendHtml(res, 200, `<!DOCTYPE html>
<html>
<head><title>Online Food Ordering</title></head>
<body>
  <h1>Welcome to Online Food Ordering</h1>
  <p>Fresh food, delivered fast.</p>
  <ul>
    <li><a href="/menu">View Menu</a></li>
    <li><a href="/foods">Available Foods (JSON)</a></li>
    <li><a href="/about">About Us</a></li>
  </ul>
</body>
</html>`);
  }

  // GET /foods - only available items
  if (method === 'GET' && pathname === '/foods') {
    return sendJson(res, 200, foods.filter((food) => food.availability === true));
  }

  // GET /about
  if (method === 'GET' && pathname === '/about') {
    return sendHtml(res, 200, `<!DOCTYPE html>
<html>
<head><title>About</title></head>
<body>
  <h1>About Our Restaurant</h1>
  <p>Online Food Ordering serves fast food, Italian dishes and beverages.</p>
  <p>Open daily: 10:00 AM - 11:00 PM</p>
  <p>Contact: orders@foodordering.example</p>
  <a href="/">Back to Home</a>
</body>
</html>`);
  }

  // GET /menu - static file via fs
  if (method === 'GET' && pathname === '/menu') {
    return fs.readFile(path.join(__dirname, 'public', 'menu.html'), (err, content) => {
      if (err) {
        return sendJson(res, 500, { error: 'Internal Server Error: unable to read menu.html' });
      }
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(content);
    });
  }

  // POST /add-food
  if (method === 'POST' && pathname === '/add-food') {
    let body = '';
    req.on('data', (chunk) => { body += chunk; });
    req.on('end', () => {
      let food;
      try {
        food = JSON.parse(body);
      } catch {
        return sendJson(res, 400, { error: 'Invalid JSON' });
      }

      if (food === null || typeof food !== 'object' || Array.isArray(food)) {
        return sendJson(res, 400, { error: 'Request body must be a JSON object' });
      }
      const missing = REQUIRED_FIELDS.filter((field) => food[field] === undefined || food[field] === null || food[field] === '');
      if (missing.length > 0) {
        return sendJson(res, 400, { error: `Missing required fields: ${missing.join(', ')}` });
      }

      const newFood = {
        id: food.id,
        foodName: food.foodName,
        category: food.category,
        price: food.price,
        availability: food.availability,
      };
      foods.push(newFood);
      sendJson(res, 201, { message: 'Food item added successfully', food: newFood });
    });
    return;
  }

  // Invalid route
  sendJson(res, 404, { error: 'Route not found' });
});

server.listen(PORT, () => {
  console.log(`HTTP Server running at http://localhost:${PORT}`);
});
