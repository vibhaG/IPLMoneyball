// This file provides web-compatible functions for authentication
// and is safe to import from both server and client code

// Simple password hashing with a more reliable algorithm for browser & Node.js
export function hashPassword(password: string, salt = createRandomSalt()): string {
  // In a real production app, use a strong hashing algorithm
  const hash = stringToHash(password + salt);
  return `${hash}.${salt}`;
}

export function comparePasswords(supplied: string, stored: string): boolean {
  try {
    const [hash, salt] = stored.split('.');
    if (!hash || !salt) {
      console.error("Invalid stored password format");
      return false;
    }
    
    const suppliedHash = stringToHash(supplied + salt);
    return hash === suppliedHash;
  } catch (error) {
    console.error("Error comparing passwords:", error);
    return false;
  }
}

export function createRandomSalt(): string {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15);
}

// Improved string hashing function that works in both Node.js and browser
// This produces more consistent hashes than the previous version
function stringToHash(str: string): string {
  // Simple implementation of djb2 hash algorithm
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 33) ^ str.charCodeAt(i);
  }
  
  // Convert to a positive hex string
  return (hash >>> 0).toString(16);
}