const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
require('dotenv').config(); // Loads environment variables from .env file

const app = express();
app.use(cors());
app.use(bodyParser.json());

// --- Mongoose Connection ---
const MONGO_URI = process.env.MONGO_URI;

mongoose.connect(MONGO_URI)
  .then(() => console.log('✅ MongoDB connected successfully!'))
  .catch(err => console.error('❌ MongoDB connection error:', err));


// --- User Schema ---
const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
  role: String,
  quizHistory: Array,
  registrationDate: Date
});
const User = mongoose.model('User', userSchema);


// --- Question Schema ---
const questionSchema = new mongoose.Schema({
  branch: String,
  subject: String,
  question: String,
  options: [String],
  correct: mongoose.Schema.Types.Mixed, // can be a number (index) or an array of numbers
  type: String, // e.g., 'mcq', 'msq'
  explanation: String
});
const Question = mongoose.model('Question', questionSchema);


// --- API ROUTES (MUST COME BEFORE SERVING FRONTEND) ---

// Get all users
app.get('/api/users', async (req, res) => {
  try {
    const users = await User.find();
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching users', error });
  }
});

// Add a user
app.post('/api/users', async (req, res) => {
  try {
    const user = new User(req.body);
    await user.save();
    res.status(201).json(user);
  } catch (error) {
    res.status(400).json({ message: 'Error creating user', error });
  }
});

// Edit a user
app.put('/api/users/:id', async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    res.status(400).json({ message: 'Error updating user', error });
  }
});

// Delete a user
app.delete('/api/users/:id', async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting user', error });
  }
});

// Get all questions (optionally filter by branch/subject)
app.get('/api/questions', async (req, res) => {
  try {
    const { branch, subject } = req.query;
    const filter = {};
    if (branch) filter.branch = branch;
    if (subject) filter.subject = subject;
    const questions = await Question.find(filter);
    res.json(questions);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching questions', error });
  }
});

// Add a question
app.post('/api/questions', async (req, res) => {
  try {
    const question = new Question(req.body);
    await question.save();
    res.status(201).json(question);
  } catch (error) {
    res.status(400).json({ message: 'Error creating question', error });
  }
});

// Edit a question
app.put('/api/questions/:id', async (req, res) => {
  try {
    const question = await Question.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!question) {
      return res.status(404).json({ message: 'Question not found' });
    }
    res.json(question);
  } catch (error) {
    res.status(400).json({ message: 'Error updating question', error });
  }
});

// Delete a question
app.delete('/api/questions/:id', async (req, res) => {
  try {
    const question = await Question.findByIdAndDelete(req.params.id);
    if (!question) {
      return res.status(404).json({ message: 'Question not found' });
    }
    res.json({ success: true, message: 'Question deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting question', error });
  }
});


// --- SERVE FRONTEND FILES ---
// This serves all HTML, CSS, and JS files from a 'public' folder.
app.use(express.static(path.join(__dirname, 'public')));

// For any other route that is not an API route, send the main index.html file.
// This is important for single-page applications and client-side routing.
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// This block is for local development only. Vercel ignores it.
if (require.main === module) {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`🚀 Server is running locally on http://localhost:${PORT}`);
  });
}

// --- EXPORT THE APP FOR VERCEL (NO app.listen() NEEDED) ---
module.exports = app;