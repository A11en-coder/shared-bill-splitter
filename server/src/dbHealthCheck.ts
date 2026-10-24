import { PrismaClient } from '../generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

// Function to check the health of the database connection
export async function checkDatabaseHealth(): Promise<boolean> {
  try {
    // Attempt to connect to the database
    await prisma.$connect();
    // If the connection is successful and operational, return true
    const groups = await prisma.group.findMany();
    console.log("Groups:", groups);
    return true;
  } catch (error) {
    // If there is an error, log it and return false
    console.error('Database connection error:', error);
    return false;
  } finally {
    // Disconnect from the database after the health check
    await prisma.$disconnect();
  }
}

checkDatabaseHealth().then((isHealthy) => {
  if (isHealthy) {
    console.log('Database connection is healthy.');
    } else {
    console.error('Database connection is not healthy.');
  }
})

