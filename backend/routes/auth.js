const express = require('express');
const jwt = require('jsonwebtoken');
const db = require('../utils/db');

const router = express.Router();

router.post('/register', async (req, res) => {
  try {
    const { phone, password, role, fullName } = req.body;
    
    const existingUser = db.findOne('users', { phone });
    if (existingUser) return res.status(400).json({ error: 'Phone already registered' });
    
    const newUser = db.insert('users', { phone, password, role: role || 'user', fullName });
    
    const token = jwt.sign({ id: newUser._id, role: newUser.role }, process.env.JWT_SECRET || 'secret', { expiresIn: '7d' });
    res.json({ token, user: { id: newUser._id, phone: newUser.phone, role: newUser.role, fullName: newUser.fullName } });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { phone, password } = req.body;
    
    const user = db.findOne('users', { phone });
    if (!user || user.password !== password) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }
    
    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET || 'secret', { expiresIn: '7d' });
    res.json({ token, user: { id: user._id, phone: user.phone, role: user.role, fullName: user.fullName } });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
