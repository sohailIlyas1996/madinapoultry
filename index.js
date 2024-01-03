const express = require('express');
const path = require('path');

const app = express();

// Serving static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// Handling the root route ('/')
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
