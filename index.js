const express = require('express');
const path = require('path');
const passport = require('passport');
const expressSession=require('express-session')
const localStrategy=require('passport-local');
const flash=require('connect-flash');
const app = express();
const mongoose = require('mongoose');
const studentModel = require('./studen'); // Import your student model

const productModel = require('./prod'); 
const orderModel = require('./order');
const { log } = require('console');

passport.use('student-local', new localStrategy(studentModel.authenticate()));



app.use(flash());
app.use(expressSession({
  secret: "secret",
  resave: false,
  saveUninitialized: false,

}))

app.use(passport.initialize());
app.use(passport.session());
passport.serializeUser(studentModel.serializeUser());
passport.deserializeUser(studentModel.deserializeUser());



app.use(express.json());


// Serving static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// Handling the root route ('/')
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
  });
  app.get('/order',isAuthenticated, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'placeorder.html'));
  });

app.get('/admin',isAuthenticated, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

app.get('/addstock', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'addstock.html'));
});
app.get('/addproducts', isAuthenticated,(req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'product.html'));
});


app.get('/allstudents',async (req, res) => {
  try {
    const allStudents = await studentModel.find({});
  // Create a new PDF document
  

    // res.render('studentData', { students: allStudents}); // Render 'index.ejs' and pass fetched data
  res.send(allStudents);
  
  
  } catch (err) {
    console.error('Error fetching student data:', err);
    res.status(500).send('Error fetching student data');
  }
});

app.get('/allproducts', async (req, res) => {
  try {
    const allProducts = await productModel.find({}); // Fetch all products from the database
    res.send( allProducts ); // Render 'products.ejs' and pass fetched data
  } catch (err) {
    console.error('Error fetching products:', err);
    res.status(500).send('Error fetching products');
  }
});

app.get('/allorders', async (req, res) => {
  try {
    const allorders = await orderModel.find({}); // Fetch all products from the database
    res.send( allorders ); // Render 'products.ejs' and pass fetched data
  } catch (err) {
    console.error('Error fetching products:', err);
    res.status(500).send('Error fetching products');
  }
});
app.get('/showallproducts', async (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'productDetail.html'));});


// Handle POST request to '/login'
// app.post('/login', (req, res) => {
//     const { username, password } = req.body;
//     // You can process the username and password here
//     console.log('Received username:', username);
//     console.log('Received password:', password);

//     // Respond with a success or error message (just an example)
//     res.json({ message: 'Received login data successfully.' });
// });


// Add a middleware to handle parsing of the request body
app.use(express.urlencoded({ extended: true }));

// This middleware should be used before the '/login' route
app.post('/login', (req, res, next) => {
  passport.authenticate('student-local', (err, user, info) => {
    if (err) {
      return next(err);
    }
    if (!user) {
      console.log('Authentication failed:', info.message);
      req.flash('error', info.message);
      return res.redirect('/login');
    }
    req.logIn(user, function(err) {
      if (err) {
        return next(err);
      }
      return res.redirect('/admin');
    });
  })(req, res, next);
});


app.post('/registerStudent',isAuthenticated, function(req, res) {
  const {  name,username,password,studentId,className } = req.body;
  console.log( name,username,password,studentId,className);
  const studentData = new studentModel({ name,username,password,studentId,className });
  

  studentModel.register(studentData, password, function(err, user) {
    if (err) {
    console.log(err)
      return res.redirect('/addstock'); // Redirect to home page on registration error
    }

    passport.authenticate('student-local')(req, res, function () {
      res.redirect('/admin'); // Redirect to profile after successful registration
    });
  });
});

app.post('/addProduct', isAuthenticated,async (req, res) => {
  const { name, description, price, category, quantity } = req.body;

  try {
    // Create a new product instance based on the Product model
    const newProduct = new productModel({
      name,
      description,
      price,
      category,
      quantity
    });
    console.log(newProduct);

    // Save the new product to the database
    await newProduct.save();

    res.redirect('./showallproducts');
  } catch (error) {
    console.error('Error adding product:', error);
    res.status(500).json({ error: 'Error adding product' });
  }
});


app.post('/updateProduct/:id', async (req, res) => {
  const productId = req.params.id; // Extract the product ID from the request parameters

  try {
    const { name, description, price, category, quantity } = req.body;

    // Find the product by ID and update its fields
    const updatedProduct = await productModel.findByIdAndUpdate(productId, {
      name,
      description,
      price,
      category,
      quantity
    }, { new: true }); // { new: true } returns the updated document

    if (!updatedProduct) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.redirect('/showallproducts'); // Redirect to the page showing all products
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({ message: 'Error updating product' });
  }
});

app.delete('/deleteProduct/:productId', async (req, res) => {
  const productId = req.params.productId;
console.log(productId);
  try {
    const deletedProduct = await productModel.findByIdAndDelete(productId);

    if (!deletedProduct) {
      return res.status(404).send('Product not found');
    }

    res.status(200).send('Product deleted successfully');
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).send('Error deleting product');
  }
});
app.post('/createOrder',isAuthenticated, async (req, res) => {
  const { products } = req.body;

  try {
    let totalAmount = 0;

    for (const item of products) {
      const product = await productModel.findById(item.productId);
      if (product) {
        totalAmount += product.price * item.quantity;
      }
    }

    const newOrder = new orderModel({
      products: products.map(item => ({ productId: item.productId, quantity: item.quantity })),
      totalAmount: totalAmount
    });

    const savedOrder = await newOrder.save();
    res.status(201).json(savedOrder);
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ error: 'Failed to create order' });
  }
});


function isAuthenticated(req, res, next) {
  // Passport.js adds the `req.isAuthenticated()` method
  // This method returns true if the user is authenticated, otherwise false
  if (req.isAuthenticated()) {
    return next(); // User is authenticated, proceed to the next middleware
  }
  
  // User is not authenticated, redirect them to the login page or show an error message
  res.redirect('/login'); // Redirect to your login route
}


app.get('/logout', (req, res) => {
  // Passport.js method to log out the user with a callback function
  req.logout((err) => {
    if (err) {
      // Handle any potential errors during logout
      console.error(err);
      return res.redirect('/'); // Redirect to the home page or an error page
    }
    // If logout is successful, redirect the user to the login page
    res.redirect('/login');
  });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
