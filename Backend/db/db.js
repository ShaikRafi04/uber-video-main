const mongoose = require('mongoose');
const dns = require('dns');

// Fix for Windows / ISP DNS blocking MongoDB Atlas SRV records (querySrv ECONNREFUSED)
try {
    dns.setServers(['8.8.8.8', '8.8.4.4']);
} catch (e) {
    console.warn('Could not set custom DNS servers:', e.message);
}

async function seedDemoCaptain() {
    try {
        const captainModel = require('../models/captain.model');
        const count = await captainModel.countDocuments();
        if (count === 0) {
            const hashedPassword = await captainModel.hashPassword('password123');
            await captainModel.create({
                fullname: {
                    firstname: 'Rajesh',
                    lastname: 'Sharma'
                },
                email: 'captain@example.com',
                password: hashedPassword,
                status: 'active',
                vehicle: {
                    color: 'White',
                    plate: 'DL 01 AB 1234',
                    capacity: 4,
                    vehicleType: 'car'
                },
                location: {
                    ltd: 28.6139,
                    lng: 77.2090
                }
            });
            console.log('✅ Demo Captain seeded: email: captain@example.com, password: password123');
        }
    } catch (err) {
        console.error('Error seeding demo captain:', err.message);
    }
}

function connectToDb() {
    mongoose.connect(process.env.DB_CONNECT)
        .then(() => {
            console.log('Connected to DB');
            seedDemoCaptain();
        })
        .catch(err => console.log('Database connection error:', err));
}

module.exports = connectToDb;