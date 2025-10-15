/**
 * Main Entry Point for zkfetch-stellar-example
 *
 * This is the main entry point that provides a unified interface for
 * requesting proofs and verifying them on the Stellar blockchain.
 */

import { requestProof } from './requestProof.js';
import { verifyProof } from './verifyProof.js';
import { CONFIG } from './config.js';

/**
 * Main application class
 */
class ZkFetchStellarApp {
  constructor() {
    this.config = CONFIG;
  }

  /**
   * Requests a new proof for Stellar price data
   * @param {string} outputPath - Optional custom output path
   * @returns {Promise<Object>} The generated proof
   */
  async requestStellarPriceProof(outputPath) {
    console.log('🌟 Requesting Stellar price proof...');
    return await requestProof(outputPath, 'stellar');
  }

  /**
   * Requests a new proof for Trading Economics countries GDP data
   * @param {string} outputPath - Optional custom output path
   * @returns {Promise<Object>} The generated proof
   */
  async requestTradingEconomicsProof(outputPath) {
    console.log('🌍 Requesting Trading Economics countries GDP proof...');
    return await requestProof(outputPath, 'trading-economics');
  }

  /**
   * Requests a new proof for Forbes real-time billionaires data
   * @param {string} outputPath - Optional custom output path
   * @returns {Promise<Object>} The generated proof
   */
  async requestForbesProof(outputPath) {
    console.log('💰 Requesting Forbes billionaires proof...');
    return await requestProof(outputPath, 'forbes');
  }

  /**
   * Requests a new proof for AccuWeather NYC weather data
   * @param {string} outputPath - Optional custom output path
   * @returns {Promise<Object>} The generated proof
   */
  async requestAccuWeatherProof(outputPath) {
    console.log('🌤️ Requesting AccuWeather NYC proof...');
    return await requestProof(outputPath, 'accuweather');
  }

  /**
   * Requests a new proof for Goal.com live scores data
   * @param {string} outputPath - Optional custom output path
   * @returns {Promise<Object>} The generated proof
   */
  async requestGoalProof(outputPath) {
    console.log('⚽ Requesting Goal.com live scores proof...');
    return await requestProof(outputPath, 'goal');
  }

  /**
   * Verifies a proof on the Stellar blockchain
   * @param {string} proofPath - Optional custom proof file path
   * @returns {Promise<string>} Transaction hash
   */
  async verifyProofOnStellar(proofPath) {
    console.log('🔍 Verifying proof on Stellar blockchain...');
    return await verifyProof(proofPath);
  }

  /**
   * Complete workflow: request proof and verify it
   * @param {string} proofPath - Optional custom proof file path
   * @returns {Promise<Object>} Result containing proof and transaction hash
   */
  async runCompleteWorkflow(proofPath = CONFIG.PATHS.PROOF_FILE) {
    try {
      console.log('🚀 Starting complete zkFetch workflow...');

      // Step 1: Request proof
      const proof = await this.requestStellarPriceProof(proofPath);

      // Step 2: Verify proof
      const txHash = await this.verifyProofOnStellar(proofPath);

      console.log('✅ Complete workflow finished successfully!');

      return {
        proof,
        transactionHash: txHash,
        success: true,
      };
    } catch (error) {
      console.error('❌ Workflow failed:', error.message);
      return {
        error: error.message,
        success: false,
      };
    }
  }

  /**
   * Displays application information
   */
  displayInfo() {
    console.log(`
🌟 zkFetch Stellar Example
========================

This application demonstrates zero-knowledge proof generation and verification
using the Reclaim Protocol and Stellar blockchain.

Features:
• Generate ZK proofs for cryptocurrency price data (Stellar)
• Generate ZK proofs for economic data (Trading Economics countries GDP)
• Generate ZK proofs for billionaires data (Forbes real-time billionaires)
• Generate ZK proofs for weather data (AccuWeather NYC)
• Generate ZK proofs for sports data (Goal.com live scores)
• Verify proofs on Stellar testnet using Soroban contracts
• Complete workflow automation

Configuration:
• Network: ${this.config.TESTNET_DETAILS.network}
• Contract: ${this.config.STELLAR.CONTRACT_ID}
• Stellar API: ${this.config.API.COINGECKO_STELLAR_PRICE}
• Trading Economics API: ${this.config.API.TRADING_ECONOMICS_COUNTRIES}
• Forbes API: ${this.config.API.FORBES_BILLIONAIRES}
• AccuWeather API: ${this.config.API.ACCUWEATHER_NYC}
• Goal.com API: ${this.config.API.GOAL_LIVE_SCORES}

Usage:
  npm run request-proof              # Generate a new Stellar price proof
  node src/index.js request-trading-economics  # Generate Trading Economics proof
  node src/index.js request-forbes  # Generate Forbes billionaires proof
  node src/index.js request-accuweather  # Generate AccuWeather NYC proof
  node src/index.js request-goal    # Generate Goal.com live scores proof
  npm run verify-proof              # Verify existing proof
  npm start                         # Run complete workflow
    `);
  }
}

/**
 * CLI interface
 */
async function main() {
  const app = new ZkFetchStellarApp();
  const command = process.argv[2];

  switch (command) {
    case 'request':
    case 'request-proof':
      await app.requestStellarPriceProof();
      break;

    case 'request-trading-economics':
      await app.requestTradingEconomicsProof();
      break;

    case 'request-forbes':
      await app.requestForbesProof();
      break;

    case 'request-accuweather':
      await app.requestAccuWeatherProof();
      break;

    case 'request-goal':
      await app.requestGoalProof();
      break;

    case 'verify':
    case 'verify-proof':
      await app.verifyProofOnStellar();
      break;

    case 'workflow':
    case 'complete':
      await app.runCompleteWorkflow();
      break;

    case 'info':
      app.displayInfo();
      break;

    default:
      console.log('Usage: node src/index.js [command]');
      console.log('Commands:');
      console.log('  request-proof            Generate a new Stellar price proof');
      console.log('  request-trading-economics Generate a new Trading Economics proof');
      console.log('  request-forbes           Generate a new Forbes billionaires proof');
      console.log('  request-accuweather      Generate a new AccuWeather NYC proof');
      console.log('  request-goal             Generate a new Goal.com live scores proof');
      console.log('  verify-proof             Verify existing proof');
      console.log('  workflow                 Run complete workflow');
      console.log('  info                     Display application info');
      break;
  }
}

// Export for use as module
export { ZkFetchStellarApp };

// Run CLI if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}
