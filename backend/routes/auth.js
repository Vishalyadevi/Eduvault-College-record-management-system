import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { pool } from '../db/db.js';
import dotenv from 'dotenv';

dotenv.config();
const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'faculty-management-secret-key';

// Login route
router.post('/login', async (req, res) => {
  console.log('Login attempt:', req.body); // Debug log
  const { username, password } = req.body;

  // Validate request
  if (!username || !password) {
    console.log('Missing credentials'); // Debug log
    return res.status(400).json({ 
      success: false,
      message: 'Username and password are required' 
    });
  }

  try {
    // Check for demo credentials first - case insensitive for username
    if (username.toLowerCase() === 'faculty' && password === 'faculty123') {
      console.log('Demo login successful'); // Debug log
      // For demo purposes, create a token without database lookup
      const token = jwt.sign(
        { 
          id: 1, 
          username: 'faculty', 
          role: 'faculty' 
        },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      // Return user info and token
      return res.status(200).json({
        success: true,
        message: 'Login successful',
        user: {
          id: 1,
          username: 'faculty',
          name: 'Demo Faculty',
          email: 'faculty@example.com',
          department: 'Computer Science',
          role: 'faculty'
        },
        token
      });
    }
    console.log(pool);
    // Check if the database connection is working
    try {
      await pool.query('SELECT 1');
      console.log('Database connection successful'); // Debug log
    } catch (dbError) {
      console.error('Database connection error:', dbError);
      return res.status(500).json({
        success: false,
        message: 'Database connection error'
      });
    }
    
    // Get user from database for regular login
    console.log('Querying database for user:', username); // Debug log
    const [rows] = await pool.query('SELECT * FROM users WHERE username = ?', [username]);
    console.log('Database query result rows:', rows.length); // Debug log
    
    // Check if user exists
    if (rows.length === 0) {
      console.log('User not found in database'); // Debug log
      return res.status(401).json({ 
        success: false,
        message: 'Invalid username or password' 
      });
    }

    const user = rows[0];
    console.log('User found:', user.username); // Debug log (don't log the full user object with password)
    
    // For regular login with bcrypt
    const validPassword = await bcrypt.compare(password, user.password);
    console.log('Password validation result:', validPassword); // Debug log
    
    if (!validPassword) {
      console.log('Invalid password'); // Debug log
      return res.status(401).json({ 
        success: false,
        message: 'Invalid username or password' 
      });
    }

    // Generate token
    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    console.log('Login successful for database user'); // Debug log
    // Return user info and token
    res.status(200).json({
      success: true,
      message: 'Login successful',
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        email: user.email,
        department: user.department,
        role: user.role
      },
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error during login' 
    });
  }
});

// Get current user route
router.get('/me', async (req, res) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access denied. No token provided.' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Handle demo faculty account
    if (decoded.username === 'faculty') {
      return res.status(200).json({ 
        success: true,
        user: {
          id: 1,
          username: 'faculty',
          name: 'Demo Faculty',
          email: 'faculty@example.com',
          department: 'Computer Science',
          role: 'faculty'
        }
      });
    }
    
    // Get user details from database
    const [rows] = await pool.query('SELECT id, username, name, email, department, role FROM users WHERE id = ?', [decoded.id]);
    
    if (rows.length === 0) {
      return res.status(404).json({ 
        success: false,
        message: 'User not found' 
      });
    }

    const user = rows[0];
    res.status(200).json({ 
      success: true,
      user 
    });
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(403).json({ 
      success: false,
      message: 'Invalid token.' 
    });
  }
});
//routes/auth.js
export default router;