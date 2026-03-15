import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js'; 

// Load environment variables
dotenv.config();

// MongoDB URI
const MONGODB_URI = process.env.MONGODB_URI;

const createAdmin = async () => {
  try {
    // Connect to the database
    await mongoose.connect(MONGODB_URI);

    // Check if an admin already exists to prevent duplicates
    const existingAdmin = await User.findOne({ role: 'admin' });

    if (existingAdmin) {
      console.log('Admin already exists');
      return;
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash('admin@123', 10); // Use a strong password here

    // Create a new admin user
    const newAdmin = new User({
      username: 'admin', // Add the username field (you can choose a different name)
      email: 'admin@nec.com', // admin email
      password: hashedPassword,
      role: 'admin',
    });

    // Save the admin to the database
    await newAdmin.save();
    console.log('Admin user created successfully');
    mongoose.disconnect();
  } catch (error) {
    console.error('Error creating admin user:', error);
  }
};

createAdmin();