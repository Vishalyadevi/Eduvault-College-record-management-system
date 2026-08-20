import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js'; 

// Load environment variables
dotenv.config();

// MongoDB URI
const MONGODB_URI = process.env.MONGODB_URI;

const createStudent = async () => {
  try {
    // Connect to the database
    await mongoose.connect(MONGODB_URI);

    // Hash the password
    const hashedPassword = await bcrypt.hash('stu@123', 10); 

    // Create a new admin user
    const newAdmin = new User({
      username: 'stu1', 
      email: 'stu@nec.com', // admin email
      password: hashedPassword,
      role: 'student',
    });

    // Save the admin to the database
    await newAdmin.save();
    console.log('Student created successfully');
    mongoose.disconnect();
  } catch (error) {
    console.error('Error creating admin user:', error);
  }
};

createStudent()