const fs = require('fs');
const path = require('path');

const DB_FILE = path.join(__dirname, '..', 'database.json');

const defaultData = {
  users: [],
  events: [],
  grounds: [],
  bookings: [],
  coaches: [],
  coachBookings: [],
  rentals: [],
  notifications: []
};

class LocalDB {
  constructor() {
    this.data = defaultData;
    this.load();
  }

  load() {
    if (fs.existsSync(DB_FILE)) {
      try {
        const raw = fs.readFileSync(DB_FILE, 'utf8');
        this.data = JSON.parse(raw);
      } catch (err) {
        console.error("Failed to parse DB, using defaults", err);
      }
    } else {
      this.save();
    }
  }

  save() {
    fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), 'utf8');
  }

  get(collection) { return this.data[collection] || []; }
  
  insert(collection, item) {
    if (!this.data[collection]) this.data[collection] = [];
    item._id = Math.random().toString(36).substring(2, 11) + Date.now().toString(36);
    item.createdAt = new Date().toISOString();
    this.data[collection].push(item);
    this.save();
    return item;
  }

  update(collection, id, updates) {
    const list = this.data[collection];
    const idx = list.findIndex(i => String(i._id) === String(id) || String(i.id) === String(id));
    if (idx !== -1) {
      this.data[collection][idx] = { ...list[idx], ...updates, updatedAt: new Date().toISOString() };
      this.save();
      return this.data[collection][idx];
    }
    return null;
  }

  findOne(collection, query) {
    const list = this.data[collection] || [];
    return list.find(item => {
      return Object.keys(query).every(key => item[key] === query[key]);
    });
  }

  find(collection, query = {}) {
    const list = this.data[collection] || [];
    return list.filter(item => {
      return Object.keys(query).every(key => item[key] === query[key]);
    });
  }
}

module.exports = new LocalDB();
