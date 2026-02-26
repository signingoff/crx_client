import dotenv from 'dotenv';

dotenv.config();

export const xCookies = {
  auth_token: process.env.X_AUTH_TOKEN,
  ct0: process.env.X_CT0
};

export function validateCookies() {
  if (!xCookies.auth_token || !xCookies.ct0) {
    throw new Error('Missing X.com cookies. Please set X_AUTH_TOKEN and X_CT0 in .env file');
  }
}
