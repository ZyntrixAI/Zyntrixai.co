const express = require('express');
const path = require('path');
const fs = require('fs').promises;

const app = express();
const port = process.env.PORT || 3000;
const dataDir = path.join(__dirname, 'data');
const messagesFile = path.join(dataDir, 'messages.json');
const productsFile = path.join(dataDir, 'products.json');

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, './')));

app.get('/api/products', async (req, res) => {
  try {
    const content = await fs.readFile(productsFile, 'utf8');
    const products = JSON.parse(content);
    res.json(products);
  } catch (error) {
    console.error('Failed to load products:', error);
    res.status(500).json({ error: 'Unable to load product data.' });
  }
});

app.post('/api/contact', async (req, res) => {
  const { name, email, message } = req.body;
  if (!name || !email || !message) {
    return res.status(400).json({ error: 'Name, email, and message are required.' });
  }

  const submission = {
    id: Date.now(),
    name,
    email,
    message,
    submittedAt: new Date().toISOString(),
  };

  try {
    let existing = [];
    try {
      const current = await fs.readFile(messagesFile, 'utf8');
      existing = JSON.parse(current);
    } catch (readError) {
      if (readError.code !== 'ENOENT') throw readError;
    }

    existing.push(submission);
    await fs.writeFile(messagesFile, JSON.stringify(existing, null, 2), 'utf8');

    res.status(201).json({ status: 'success', message: 'Message received.' });
  } catch (error) {
    console.error('Failed to save contact message:', error);
    res.status(500).json({ error: 'Unable to save your message. Please try again later.' });
  }
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
