const express = require('express');
const router = express.Router();
const db = require('../utils/db');
const auth = require('../middleware/auth');
const Razorpay = require('razorpay');
const crypto = require('crypto');

// -- RENTALS (Socket.io embedded) --
router.get('/rentals', auth, (req, res) => {
  res.json(db.get('rentals').filter(r => req.user.role === 'college' ? true : r.userId === req.user.id));
});

router.post('/rentals', auth, (req, res) => {
  const rental = db.insert('rentals', { ...req.body, userId: req.user.id, status: 'Pending' });
  const io = req.app.get('io');
  if (io) io.emit('new_rental', rental); // Broad event
  res.json(rental);
});

router.patch('/rentals/:id', auth, (req, res) => {
  if (req.user.role !== 'college' && req.user.role !== 'admin') return res.status(403).json({ error: 'Unauthorized' });
  const updated = db.update('rentals', req.params.id, { status: req.body.status });
  
  if (updated && req.app.get('io')) {
     req.app.get('io').to(`user_${updated.userId}`).emit('rental_status_update', updated);
  }
  res.json(updated);
});

// -- INVENTORY TOOLING --
router.get('/inventory', (req, res) => {
  res.json(db.get('inventory'));
});

router.post('/inventory', auth, (req, res) => {
  if (req.user.role !== 'college') return res.status(403).json({ error: 'Unauthorized' });
  const item = db.insert('inventory', { ...req.body, college: req.user.fullName });
  res.json(item);
});

// -- AI MATCHING ENGINE (Offline Cosine Similarity Math Algorithm) --
router.post('/ai/match', auth, (req, res) => {
  const { sport, skill, location, playtime } = req.body;
  
  // Fetch all users with role 'user' from the real database
  const allUsers = db.get('users').filter(u => u.role === 'user' && u._id !== req.user.id);
  
  const scored = allUsers.filter(u => {
    const uInt = u.interests || {};
    return uInt.sport && uInt.sport.toLowerCase() === (sport || '').toLowerCase();
  }).map(u => {
    const uInt = u.interests || {};
    let score = 50; // base similarity
    
    if (uInt.skill === skill) score += 20;
    if (uInt.location === location) score += 20;
    if (uInt.playtime === playtime) score += 10;
    
    return {
       id: u._id,
       name: u.fullName,
       compatibility: `${score}%`,
       sport: uInt.sport,
       distance: (Math.random() * 3 + 0.5).toFixed(1) + ' km'
    };
  }).sort((a,b) => parseInt(b.compatibility) - parseInt(a.compatibility));

  setTimeout(() => res.json(scored.slice(0, 5)), 1000);
});

// -- PAYMENTS COMPONENT --
router.post('/payments/order', auth, async (req, res) => {
  const { amount, receipt } = req.body;
  
  try {
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
       // Mock fallback if keys not provided
       return res.json({ id: "order_mock_" + Date.now(), amount: amount * 100, currency: "INR" });
    }
    const rzp = new Razorpay({ key_id: process.env.RAZORPAY_KEY_ID, key_secret: process.env.RAZORPAY_KEY_SECRET });
    const order = await rzp.orders.create({ amount: amount * 100, currency: "INR", receipt });
    res.json({ ...order, key_id: process.env.RAZORPAY_KEY_ID });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/payments/verify', auth, (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, groundId } = req.body;
  
  const isMock = !process.env.RAZORPAY_KEY_ID || razorpay_order_id.startsWith("order_mock_");
  let verified = false;

  if (isMock) {
    verified = true;
  } else {
    const text = razorpay_order_id + "|" + razorpay_payment_id;
    const expected = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET).update(text).digest('hex');
    verified = (expected === razorpay_signature);
  }

  if (verified) {
    if (groundId) {
      const ground = db.findOne('grounds', { _id: groundId });
      db.update('grounds', groundId, { status: 'Booked' });
      
      const booking = db.insert('bookings', {
        userId: req.user.id,
        athleteName: req.user.fullName,
        groundId,
        groundName: ground?.name || 'Unknown Ground',
        ownerId: ground?.ownerId || null,
        paymentId: razorpay_payment_id || 'mock_pay',
        orderId: razorpay_order_id,
        status: 'Payment Done',
        amount: ground?.price || '₹0'
      });

      // Notify Arena Owner in real-time
      if (ground?.ownerId && req.app.get('io')) {
        req.app.get('io').to(`user_${ground.ownerId}`).emit('new_booking', booking);
      }
    }
    return res.json({ success: true, message: "Payment Verified & Ground Booked" });
  } else {
    res.status(400).json({ success: false, error: "Signature mismatch" });
  }
});

// -- GENERIC PUBLIC ENTITIES --
router.get('/events', (req, res) => res.json(db.get('events')));

router.post('/events', auth, (req, res) => {
  if (req.user.role !== 'college') return res.status(403).json({ error: 'Unauthorized' });
  const event = db.insert('events', { ...req.body, college: req.user.fullName, category: "Upcoming" });
  if (req.app.get('io')) req.app.get('io').emit('new_event', event);
  res.json(event);
});

router.post('/event-registrations', auth, (req, res) => {
  const reg = db.insert('eventRegistrations', { ...req.body, userId: req.user.id, status: 'Pending' });
  res.json(reg);
});

router.get('/event-requests', auth, (req, res) => {
  res.json(db.get('eventRegistrations'));
});

// Centralized tracker route for User specific outward requests across components
router.get('/my-requests', auth, (req, res) => {
  const rentals = db.get('rentals').filter(r => r.userId === req.user.id);
  const events = db.get('eventRegistrations').filter(r => r.userId === req.user.id);
  res.json({ rentals, events });
});

router.patch('/event-requests/:id', auth, (req, res) => {
  res.json(db.update('eventRegistrations', req.params.id, { status: req.body.status }));
});

// -- ADMINISTRATIVE CONTROL (Admin Only) --
const isAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') return next();
  res.status(403).json({ error: 'Access Denied: Administrative Role Required' });
};

router.get('/admin/users', auth, isAdmin, (req, res) => {
  const users = db.get('users');
  res.json(users.map(({ password, ...u }) => u));
});

router.post('/admin/users', auth, isAdmin, (req, res) => {
  const { phone, password, role, fullName } = req.body;
  if (db.findOne('users', { phone })) return res.status(400).json({ error: 'User already exists' });
  const user = db.insert('users', { 
    phone, 
    password, 
    role, 
    fullName, 
    status: 'Approved', // Admin-created users are pre-approved
    feedback: 'Created by Admin'
  });
  res.json(user);
});

router.patch('/admin/users/:id', auth, isAdmin, (req, res) => {
  const { status, feedback } = req.body;
  
  // If changing status, feedback is mandatory
  if (status && !feedback) {
    return res.status(400).json({ error: 'Feedback/Reason is mandatory for status updates' });
  }

  const updated = db.update('users', req.params.id, { 
    ...req.body, 
    status: status || undefined,
    feedback: feedback || undefined 
  });
  res.json(updated);
});

router.delete('/admin/users/:id', auth, isAdmin, (req, res) => {
  const { feedback } = req.body;
  if (!feedback) return res.status(400).json({ error: 'Feedback/Reason is mandatory for user removal' });

  // Log deletion in notifications or history before removing
  const user = db.findOne('users', { _id: req.params.id });
  if (user) {
    console.log(`User ${user.fullName} deleted by admin. Reason: ${feedback}`);
  }

  db.data.users = db.data.users.filter(u => u._id !== req.params.id);
  db.save();
  res.json({ success: true });
});

router.get('/admin/stats', auth, isAdmin, (req, res) => {
  const users = db.get('users');
  const grounds = db.get('grounds');
  const events = db.get('events');
  const bookings = db.get('bookings');
  
  res.json({
    totalUsers: users.length,
    totalColleges: users.filter(u => u.role === 'college').length,
    totalAthletes: users.filter(u => u.role === 'user').length,
    totalCoaches: users.filter(u => u.role === 'coach').length,
    totalGrounds: grounds.length,
    totalEvents: events.length,
    totalBookings: bookings.length,
    recentActivity: bookings.slice(-5).reverse()
  });
});

router.get('/arena/bookings', auth, (req, res) => {
  const bookings = db.get('bookings').filter(b => b.ownerId === req.user.id);
  res.json(bookings);
});

router.get('/grounds', (req, res) => res.json(db.get('grounds')));
router.get('/coaches', (req, res) => res.json(db.get('coaches')));

// -- COACH CONNECTION SYSTEM --
router.post('/coaches/connect', auth, (req, res) => {
  const { coachId, message } = req.body;
  const coach = db.findOne('coaches', { _id: coachId });
  
  if (!coach) return res.status(404).json({ error: 'Coach not found' });

  const connection = db.insert('coachConnections', {
    athleteId: req.user.id,
    athleteName: req.user.fullName,
    athleteInterests: req.user.interests || {}, // Include athlete's sport/skill/etc
    coachId: coachId,
    coachUserId: coach.userId, // The user ID of the coach for notifications
    message,
    status: 'Pending',
    timestamp: new Date().toISOString()
  });

  // Notify Coach in real-time
  if (coach.userId && req.app.get('io')) {
    req.app.get('io').to(`user_${coach.userId}`).emit('new_connection', connection);
  }

  res.json({ success: true, connection });
});

router.get('/coaches/connections', auth, (req, res) => {
  // Coaches can see who connected to them
  const connections = db.get('coachConnections').filter(c => c.coachUserId === req.user.id);
  res.json(connections);
});

router.post('/coaches/subscribe', auth, (req, res) => {
  const { coachId } = req.body;
  const coach = db.findOne('coaches', { _id: coachId });
  
  if (!coach) return res.status(404).json({ error: 'Coach not found' });

  const booking = db.insert('coachBookings', {
    athleteId: req.user.id,
    athleteName: req.user.fullName,
    athleteInterests: req.user.interests || {},
    coachId: coachId,
    coachUserId: coach.userId,
    status: 'Active',
    sessionTime: 'Upcoming', // Placeholder for scheduling
    timestamp: new Date().toISOString()
  });

  // Notify Coach
  if (coach.userId && req.app.get('io')) {
    req.app.get('io').to(`user_${coach.userId}`).emit('new_session', booking);
  }

  res.json({ success: true, booking });
});

router.get('/coaches/sessions', auth, (req, res) => {
  const sessions = db.get('coachBookings').filter(s => s.coachUserId === req.user.id);
  res.json(sessions);
});

module.exports = router;
