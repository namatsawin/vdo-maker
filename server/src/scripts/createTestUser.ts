import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function createTestUser() {
  try {
    const email = 'test@example.com';
    const password = 'password123';
    const name = 'Test User';

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      console.log('Test user already exists');
      
      // Generate JWT token for existing user
      const secret = process.env.JWT_SECRET || 'your-super-secret-jwt-key';
      const token = jwt.sign(
        { userId: existingUser.id },
        secret,
        { expiresIn: '7d' }
      );
      
      console.log('Test user JWT token:', token);
      return;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create test user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name
      }
    });

    // Generate JWT token
    const secret = process.env.JWT_SECRET || 'your-super-secret-jwt-key';
    const token = jwt.sign(
      { userId: user.id },
      secret,
      { expiresIn: '7d' }
    );

    console.log('Test user created successfully');
    console.log('Email:', email);
    console.log('Password:', password);
    console.log('JWT Token:', token);
    
  } catch (error) {
    console.error('Error creating test user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestUser();
