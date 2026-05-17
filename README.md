SportConnect 🏆

AI-Powered Sports Community & Booking Platform

SportConnect is a full-stack MERN web platform built for hackathons and sports communities.
It connects players, colleges, coaches, and ground owners into one ecosystem with AI-powered matchmaking, turf booking, equipment rental, coach guidance, and real-time notifications.


---

🚀 Features

👤 Multi-Role Authentication

Supports 5 different user roles:

User

College

Ground Owner

Coach

Admin


Authentication Includes:

JWT Authentication

bcrypt password hashing

Role-based login

10-digit phone validation

Forgot Password (Dummy OTP)

Update Password

Protected Routes



---

🧠 AI Player Matchmaking

Uses Google Gemini API to generate compatible player matches.

Features:

Sport-based matching

Skill-level matching

City & availability filtering

Compatibility score generation

AI-generated match reason



---

🏟️ Ground Booking System

Users and colleges can:

Browse sports grounds

View amenities

View map location

Select slots

Book grounds

Pay using Razorpay Test Mode


Includes:

Booking history

Owner notifications

Revenue tracking



---

🧑‍🏫 Coach Guidance

Users can:

Browse coaches

Filter by sport/city/rate

Book sessions

Pay online

Receive Google Meet links


Coaches can:

Manage requests

Add Meet links

Track sessions



---

🎒 Equipment Rental System

Colleges can:

Post sports tools/equipment


Users can:

Request rentals

Track request status

Complete payments after approval



---

🏆 Event Management

Colleges can:

Post sports events

Upload posters

Share Google Form links

Declare winners


Users can:

Register for events

Track registrations



---

🔔 Real-Time Notifications

Built using Socket.io

Notification Types:

Event registrations

Ground bookings

Coach confirmations

Meet link updates

Rental request updates

Payment receipts



---

📊 Admin Dashboard

Admin can manage:

Users

Colleges

Coaches

Grounds

Events

Reports

Payments

Subscriptions


Includes:

Analytics charts

Revenue reports

Suspension controls

Event moderation



---

🎨 UI/UX Highlights

Design System

Glassmorphism UI

Animated gradient backgrounds

Floating orbs

Framer Motion transitions

Responsive mobile-first design


Animations

Hover glow buttons

Animated navbar underline

Card lift effects

Skeleton loaders

Count-up statistics

Staggered card entrances



---

🛠️ Tech Stack

Frontend

React 18

Vite

TailwindCSS

Framer Motion

React Router v6

Axios

Socket.io-client

Recharts


Backend

Node.js

Express.js

MongoDB

Mongoose

JWT

bcrypt

Socket.io


Integrations

Razorpay Test Mode

Google Gemini API

Google Maps / Leaflet

Google Meet Links



---

📁 Folder Structure

sportconnect/
│
├── client/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── routes/
│   │   ├── context/
│   │   ├── services/
│   │   └── App.jsx
│
├── server/
│   ├── controllers/
│   ├── routes/
│   ├── middleware/
│   ├── models/
│   ├── config/
│   └── server.js
│
└── README.md


---

🗄️ MongoDB Schemas

User

{
  name,
  phone,
  password,
  city,
  sport_preferences[],
  avatar,
  events_registered[],
  grounds_booked[],
  coach_sessions[],
  tools_rented[],
  notifications[]
}

College

{
  college_name,
  college_id,
  phone,
  city,
  email,
  events[],
  tools_available[],
  subscription_status
}

Ground

{
  owner_id,
  name,
  sport_types[],
  city,
  address,
  price_per_hour,
  amenities[],
  photos[],
  lat,
  lng
}


---

🔑 Important API Routes

Auth

POST /api/auth/register/:role
POST /api/auth/login/:role

Events

GET  /api/events
POST /api/events
POST /api/events/:id/register

Grounds

GET  /api/grounds
POST /api/bookings/ground

Coaches

GET  /api/coaches
POST /api/sessions/coach

AI Matching

POST /api/ai/match


---

💳 Razorpay Test Mode

Test Card

Card Number: 4111 1111 1111 1111
Expiry: Any future date
CVV: Any 3 digits


---

⚙️ Environment Variables

Backend .env

PORT=5000
MONGO_URI=your_mongodb_uri
JWT_SECRET=your_secret

RAZORPAY_KEY_ID=your_key
RAZORPAY_KEY_SECRET=your_secret

GEMINI_API_KEY=your_api_key


---

▶️ Installation

Clone Repository

git clone https://github.com/yourusername/sportconnect.git
cd sportconnect

Backend Setup

cd server
npm install
npm run dev

Frontend Setup

cd client
npm install
npm run dev


---

📱 Responsive Design

SportConnect is fully responsive:

Mobile

Tablet

Desktop


Includes:

Mobile bottom nav

Touch-friendly interactions

Adaptive grids



---

🏆 Hackathon Highlights

✅ AI-Powered Matchmaking
✅ Multi-Role Architecture
✅ Real-Time Notifications
✅ Razorpay Payments
✅ Beautiful Glassmorphism UI
✅ Fully Responsive
✅ Scalable MERN Stack


---

🔮 Future Improvements

Live chat between players

Tournament brackets

AI performance analysis

Video upload & pose tracking

GPS-based nearby players

Push notifications

PWA support



---

👨‍💻 Team

A.Kalyan Ram
A.v Hema Nandini
A.Abhinaya
Ch.Vishnu


Achievement:
SportConnect proudly secured 1st Place at the ITBI RJENEST Hackathon conducted by RVR & JC College of Engineering, winning trophies, recognition, and cash prizes for building an AI-powered sports community ecosystem
