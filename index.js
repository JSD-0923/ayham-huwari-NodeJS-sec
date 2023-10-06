// Import required modules
const express = require('express');
const fs = require('fs').promises; // Use fs.promises for async file operations
const app = express();
const path = require('path');

// Import express-validator for input validation
const { check, validationResult } = require('express-validator');

// Middleware setup
app.use(express.json()); // Parse incoming JSON data
app.set('view engine', 'pug'); // Set Pug as the template engine
app.set('views', path.resolve('./public')); // Set the views directory

// Middleware to validate the structure of the books file
const validateBooksFile = async (req, res, next) => {
    try {
        // Read and parse books data from the file
        const data = await fs.readFile('./public/books.json', 'utf-8');
        const booksData = JSON.parse(data);

        // Check if books property is an array
        if (!Array.isArray(booksData.books)) {
            return res.status(500).json({ error: 'Invalid books file structure: books property must be an array' });
        }

        // Move to the next middleware/route handler
        next();
    } catch (error) {
        // Handle errors related to reading/parsing books file
        console.error('Error reading or parsing books file:', error);
        return res.status(500).send('Internal Server Error');
    }
};

// Route to retrieve all books
app.get('/books', validateBooksFile, async (req, res) => {
    try {
        // Read and parse books data from the file
        const data = await fs.readFile('./public/books.json', 'utf-8');
        const books = JSON.parse(data);

        // Render the 'index' template with the list of books
        res.render('index', { booksList: books.books });
    } catch (error) {
        // Handle errors related to reading/parsing books file
        console.error('Error reading or parsing books file:', error);
        res.status(500).send('Internal Server Error');
    }
});

// Route to retrieve a specific book by ID
app.get('/books/:id', [
    // Validate ID parameter
    check('id').isInt().withMessage('Invalid ID parameter'),
], validateBooksFile, async (req, res) => {
    const errors = validationResult(req);

    // Check for validation errors
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        // Read and parse books data from the file
        const data = await fs.readFile('./public/books.json', 'utf-8');
        const booksData = JSON.parse(data);
        const books = booksData.books;

        // Find the book with the specified ID
        const foundBook = books.find(book => book.id === parseInt(req.params.id));

        if (foundBook) {
            // Render the 'index' template with the found book
            res.render('index', { booksList: foundBook });
        } else {
            // Handle the case where the book is not found
            res.status(404).render('index', { booksList: foundBook });
        }
    } catch (error) {
        // Handle errors related to reading/parsing books file
        console.error('Error reading or parsing books file:', error);
        res.status(500).send('Internal Server Error');
    }
});

// Route to add a new book
app.post('/books', async (req, res) => {
    try {
        // Extract new book data from the request body
        const newData = await req.body;

        // Check if new book data is provided
        if (!newData) {
            return res.status(400).json({ error: "Text is required in the request body." });
        }

        try {
            // Read existing books data from the file
            const booksData = await readBooksFile();

            // Check if the book with the specified ID already exists
            const foundBook = booksData.books.find(book => book.id === newData.id);
            if (!foundBook) {
                // Add the new book to the list and update the file
                booksData.books.push(newData);
                await fs.writeFile('./public/books.json', JSON.stringify(booksData, null, 2));
                res.status(201).json({ message: 'Book created successfully' });
            } else {
                // Handle the case where the book with the specified ID already exists
                return res.status(400).json({ error: "Book already exists." });
            }
        } catch (error) {
            // Handle errors related to reading/writing books file
            console.error('Error adding book:', error);
            throw error;
        }
    } catch (error) {
        // Handle errors related to parsing request body
        console.error('Error parsing request body:', error);
        // Handle errors related to parsing request body
        return res.status(400).json({ error: "Invalid request body." });
    }
});
        
// Helper function to read books data from the file
async function readBooksFile() {
    try {
        // Read and parse books data from the file
        const data = await fs.readFile('./public/books.json', 'utf-8');
        return JSON.parse(data);
    } catch (error) {
        // Handle errors related to reading books file
            console.error('Error reading books file:', error);
            // Create an empty books file if it doesn't exist
            await fs.writeFile("./public/books.json", '{"books":[]}');
            // Read and parse the newly created empty file
            const data = await fs.readFile('./public/books.json', 'utf-8');
            return JSON.parse(data);
        }
}
        
// Start the server on port 5000
app.listen(5000, () => {
    console.log('Server is running on port 5000');
});
        
