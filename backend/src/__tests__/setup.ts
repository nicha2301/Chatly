import dotenv from 'dotenv';

// Load environment variables from .env.test file
dotenv.config({ path: '.env.test' });

// Set timeout for tests
jest.setTimeout(30000);

// Mock console methods to reduce noise in test output
global.console = {
  ...console,
  // Uncomment to disable specific console methods during tests
  // log: jest.fn(),
  // error: jest.fn(),
  // warn: jest.fn(),
  // info: jest.fn(),
  // debug: jest.fn(),
};

// Clean up after all tests
afterAll(async () => {
  // Add any cleanup code here
}); 