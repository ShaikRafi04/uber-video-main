const rideService = require('../services/ride.service');
const { validationResult } = require('express-validator');
const mapService = require('../services/maps.service');
const { sendMessageToSocketId } = require('../socket');
const rideModel = require('../models/ride.model');
const userModel = require('../models/user.model');
const captainModel = require('../models/captain.model');


module.exports.createRide = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { userId, pickup, destination, vehicleType } = req.body;

    try {
        const ride = await rideService.createRide({ user: req.user._id, pickup, destination, vehicleType });
        res.status(201).json(ride);

        const pickupCoordinates = await mapService.getAddressCoordinate(pickup);
        const captainsInRadius = await mapService.getCaptainsInTheRadius(pickupCoordinates.ltd, pickupCoordinates.lng, 2);

        ride.otp = "";
        const rideWithUser = await rideModel.findOne({ _id: ride._id }).populate('user');

        if (captainsInRadius && captainsInRadius.length > 0) {
            captainsInRadius.forEach(captain => {
                if (captain.socketId) {
                    sendMessageToSocketId(captain.socketId, {
                        event: 'new-ride',
                        data: rideWithUser
                    });
                }
            });
        }

        // =========================================================================
        // AUTOMATIC DRIVER SIMULATION:
        // If testing on a single device/tab and no real captain accepts within 3.5s,
        // automatically assign a nearby captain, confirm the ride, and transition
        // the rider's screen from "Looking for a driver" to "Driver Confirmed"!
        // =========================================================================
        setTimeout(async () => {
            try {
                const currentRide = await rideModel.findById(ride._id);
                if (currentRide && currentRide.status === 'pending') {
                    console.log(`[Auto-Driver] No manual captain accepted. Auto-accepting ride ${ride._id}...`);

                    // 1. Find or create demo captain
                    let demoCaptain = await captainModel.findOne({ status: 'active' });
                    if (!demoCaptain) {
                        demoCaptain = await captainModel.findOne({});
                    }
                    if (!demoCaptain) {
                        demoCaptain = await captainModel.create({
                            fullname: { firstname: 'Rajesh', lastname: 'Sharma' },
                            email: 'captain@example.com',
                            password: await captainModel.hashPassword('password123'),
                            status: 'active',
                            vehicle: {
                                color: 'White',
                                plate: 'DL 01 AB 1234',
                                capacity: 4,
                                vehicleType: vehicleType === 'auto' ? 'auto' : (vehicleType === 'moto' ? 'motorcycle' : 'car')
                            },
                            location: { ltd: 28.6139, lng: 77.2090 }
                        });
                    }

                    // 2. Confirm the ride with this captain
                    const confirmedRide = await rideService.confirmRide({
                        rideId: ride._id,
                        captain: demoCaptain
                    });

                    // 3. Find the user's socket and notify them!
                    const riderUser = await userModel.findById(req.user._id);
                    if (riderUser && riderUser.socketId) {
                        console.log(`[Auto-Driver] Emitting 'ride-confirmed' to user socket: ${riderUser.socketId}`);
                        sendMessageToSocketId(riderUser.socketId, {
                            event: 'ride-confirmed',
                            data: confirmedRide
                        });

                        // 4. After 4 seconds, driver arrives & starts the ride!
                        setTimeout(async () => {
                            try {
                                const acceptedRide = await rideModel.findById(ride._id).select('+otp');
                                if (acceptedRide && acceptedRide.status === 'accepted') {
                                    console.log(`[Auto-Driver] Driver arrived. Starting ride ${ride._id}...`);
                                    const startedRide = await rideService.startRide({
                                        rideId: ride._id,
                                        otp: acceptedRide.otp,
                                        captain: demoCaptain
                                    });

                                    sendMessageToSocketId(riderUser.socketId, {
                                        event: 'ride-started',
                                        data: startedRide
                                    });
                                }
                            } catch (startErr) {
                                console.error('[Auto-Driver] Start error:', startErr.message);
                            }
                        }, 4000);
                    }
                }
            } catch (simErr) {
                console.error('[Auto-Driver] Simulation error:', simErr.message);
            }
        }, 3500);

    } catch (err) {
        console.log(err);
        return res.status(500).json({ message: err.message });
    }
};

module.exports.getFare = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { pickup, destination } = req.query;

    try {
        const fare = await rideService.getFare(pickup, destination);
        return res.status(200).json(fare);
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
}

module.exports.confirmRide = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { rideId } = req.body;

    try {
        const ride = await rideService.confirmRide({ rideId, captain: req.captain });

        sendMessageToSocketId(ride.user.socketId, {
            event: 'ride-confirmed',
            data: ride
        })

        return res.status(200).json(ride);
    } catch (err) {

        console.log(err);
        return res.status(500).json({ message: err.message });
    }
}

module.exports.startRide = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { rideId, otp } = req.query;

    try {
        const ride = await rideService.startRide({ rideId, otp, captain: req.captain });

        console.log(ride);

        sendMessageToSocketId(ride.user.socketId, {
            event: 'ride-started',
            data: ride
        })

        return res.status(200).json(ride);
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
}

module.exports.endRide = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { rideId } = req.body;

    try {
        const ride = await rideService.endRide({ rideId, captain: req.captain });

        sendMessageToSocketId(ride.user.socketId, {
            event: 'ride-ended',
            data: ride
        })



        return res.status(200).json(ride);
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
}