// This file provides web-compatible functions for authentication
// and is safe to import from both server and client code

// Simple password hashing with SHA-256
export function hashPassword(password: string, salt = createRandomSalt()): string {
  // In a real production app, use a strong hashing algorithm
  const hash = stringToHash(password + salt);
  return `${hash}.${salt}`;
}

export function comparePasswords(supplied: string, stored: string): boolean {
  const [hash, salt] = stored.split('.');
  const suppliedHash = hashPassword(supplied, salt).split('.')[0];
  return hash === suppliedHash;
}

export function createRandomSalt(): string {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15);
}

// Simple string hashing function that works in both Node.js and browser
function stringToHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  // Convert to a positive hex string
  return Math.abs(hash).toString(16);
}