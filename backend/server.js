require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');

const authRoutes = require('./routes/auth');
const apiRoutes = require('./routes/api');
const uploadRoutes = require('./routes/upload');
const path = require('path');

const app = express();
const server = http.createServer(app);

app.use(cors());
app.use(express.json());

// Initialize Socket.IO
const io = new Server(server, {
  cors: { origin: '*' }
});

// Pass IO instance to routes via app.set
app.set('io', io);

// Socket Connection handling
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  
  socket.on('join_user', (userId) => {
    socket.join(`user_${userId}`);
    console.log(`Socket ${socket.id} joined room user_${userId}`);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

app.use('/api/auth', authRoutes);
app.use('/api', apiRoutes);
app.use('/api/upload', uploadRoutes);
// Serve uploaded images as static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server & Socket.IO running on port ${PORT}`);
  console.log(`Zero-Config JSON DB initialized.`);
  console.log(`Razorpay Key Status: ${process.env.RAZORPAY_KEY_ID ? 'LOADED ('+process.env.RAZORPAY_KEY_ID.substring(0,8)+'...)' : 'MISSING'}`);
});
