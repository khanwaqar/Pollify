const express = require('express');
const fs = require('fs');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const app = express();
const PORT = 3001;

app.use(express.json());
app.use(cors());

// Helper function to load polls data from file
const loadPolls = () => {
  try {
    const data = fs.readFileSync('polls.json', 'utf-8');
    return JSON.parse(data).polls || [];
  } catch (error) {
    console.error('Error loading polls:', error);
    return [];
  }
};

// Helper function to save polls to file
const savePolls = (polls) => {
  fs.writeFileSync('polls.json', JSON.stringify({ polls }, null, 2));
};

// Create a new poll
app.post('/createPoll', (req, res) => {
  const { question, options } = req.body;

  // Load polls to ensure we are not overwriting
  const polls = loadPolls();

  const newPoll = {
    id: uuidv4(),  // Generate a unique ID
    question,
    options: options.map(option => ({ option, votes: 0 })),
    voters: []
  };

  polls.push(newPoll);
  savePolls(polls);

  res.status(201).json({ message: 'Poll created successfully', poll: newPoll });
});

// Vote on a poll
app.post('/vote', (req, res) => {
  const { pollId, option } = req.body;
  const ip = req.ip;

  // Load polls to get the latest data
  const polls = loadPolls();
  const poll = polls.find(p => p.id === pollId);

  if (!poll) {
    return res.status(404).json({ message: 'Poll not found' });
  }

  // Check if this IP has already voted
  if (poll.voters.includes(ip)) {
    return res.status(403).json({ message: 'You have already voted' });
  }

  // Find the option and increment the vote count
  const voteOption = poll.options.find(opt => opt.option === option);
  if (voteOption) {
    voteOption.votes += 1;
    poll.voters.push(ip); // Register IP as a voter
    savePolls(polls); // Save updated polls data
    res.json({ message: 'Vote registered successfully' });
  } else {
    res.status(400).json({ message: 'Invalid option' });
  }
});

// Get poll results
app.get('/results/:pollId', (req, res) => {
  // Load polls to get the latest data
  const polls = loadPolls();
  const poll = polls.find(p => p.id === req.params.pollId);

  if (poll) {
    res.json({ question: poll.question, options: poll.options });
  } else {
    res.status(404).json({ message: 'Poll not found' });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
