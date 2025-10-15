/**
 * Configuration module for the zkfetch-stellar-example project
 * Centralizes all configuration values and environment variables
 */

import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

/**
 * Application configuration
 */
export const CONFIG = {
  // Reclaim Protocol credentials (intentionally hardcoded for demo)
  RECLAIM: {
    APP_ID: '0x381994d6B9B08C3e7CfE3A4Cd544C85101b8f201',
    APP_SECRET:
      '0xfdc676e00ac9c648dfbcc271263c2dd95233a8abd391458c91ea88526a299223',
  },

  // Stellar network configuration
  STELLAR: {
    CONTRACT_ID: 'CCDFS3UOSJOM2RWKVFLT76SIKI3WCSVSFUGX24EL4NXVISFOFQB37KKO',
    SOROBAN_RPC_URL: 'https://soroban-testnet.stellar.org',
    EXPLORER_LINK: 'https://stellar.expert/explorer/testnet/tx/',
    FUNCTION_NAME: 'verify_proof',
    BASE_FEE: '100',
  },

  // Network details
  TESTNET_DETAILS: {
    network: 'TESTNET',
    networkUrl: 'https://horizon-testnet.stellar.org',
    networkPassphrase: 'Test SDF Network ; September 2015',
  },

  // API endpoints
  API: {
    COINGECKO_STELLAR_PRICE:
      'https://api.coingecko.com/api/v3/simple/price?ids=stellar&vs_currencies=usd',
    TRADING_ECONOMICS_COUNTRIES: 'https://tradingeconomics.com/',
  },

  // File paths
  PATHS: {
    PROOF_FILE: './src/proof.json',
  },

  // Environment variables
  ENV: {
    SEEDPHRASE: process.env.SEEDPHRASE,
  },
};

/**
 * Validates that all required environment variables are set
 * @throws {Error} If required environment variables are missing
 */
export function validateEnvironment() {
  const required = ['SEEDPHRASE'];
  const missing = required.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}\n` +
        'Please create a .env file with the required variables. See .env.example for reference.'
    );
  }
}

/**
 * Gets the Stellar server instance
 * @returns {Object} Stellar Horizon server instance
 */
export async function getStellarServer() {
  const { Horizon } = await import('@stellar/stellar-sdk');
  return new Horizon.Server(CONFIG.TESTNET_DETAILS.networkUrl);
}
