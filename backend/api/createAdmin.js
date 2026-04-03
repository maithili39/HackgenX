import mongoose from 'mongoose';
import { User } from './models/User.js';
import dotenv from 'dotenv';

dotenv.config();

const createAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb+srv://kritikamandale_db_user:I9PosQPG2jWEJ7fw@cluster0.6eccz9c.mongodb.net/hackgenx_complaints');
        console.log('Connected to MongoDB');

        // Check if admin exists
        const existingAdmin = await User.findOne({ email: 'admin@complaint.gov' });
        if (existingAdmin) {
            console.log('Admin user already exists');
            console.log('Email: admin@complaint.gov');
            process.exit(0);
        }

        // Create admin user
        const admin = new User({
            name: 'System Admin',
            email: 'admin@complaint.gov',
            password: 'Admin@123',
            role: 'admin'
        });

        await admin.save();
        console.log('✅ Admin user created successfully!');
        console.log('Email: admin@complaint.gov');
        console.log('Password: Admin@123');
        process.exit(0);
    } catch (error) {
        console.error('Error creating admin:', error);
        process.exit(1);
    }
};

createAdmin();
