const mongoose = require('mongoose');

// Define the Product schema
const productSchema = new mongoose.Schema({
  name: String,
  description: String,
  price: Number,
  category: String,
  quantity: {
    type: Number,
    default: 0 // Default quantity is set to 0
  },
  createdAt: {
    type: Date,
    default: Date.now // Default creation date is set to current date/time
  }
});

// Create a model based on the schema
module.exports = mongoose.model('Product', productSchema);
