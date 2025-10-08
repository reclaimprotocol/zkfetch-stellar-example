/**
 * Request Proof Module
 *
 * This module handles the generation of zero-knowledge proofs for fetching
 * cryptocurrency price data from external APIs using the Reclaim Protocol.
 */

import { ReclaimClient } from '@reclaimprotocol/zk-fetch';
import fs from 'fs';
import path from 'path';
import { CONFIG } from './config.js';

/**
 * Validates the output path for the proof file
 * @param {string} outputPath - Path where the proof will be saved
 * @throws {Error} If the path is invalid or inaccessible
 */
function validateOutputPath(outputPath) {
  if (!outputPath || typeof outputPath !== 'string') {
    throw new Error('Output path must be a valid string');
  }

  const dir = path.dirname(outputPath);
  if (!fs.existsSync(dir)) {
    throw new Error(`Directory does not exist: ${dir}`);
  }

  if (!fs.statSync(dir).isDirectory()) {
    throw new Error(`Path is not a directory: ${dir}`);
  }
}

/**
 * Creates a Reclaim client instance with proper configuration
 * @returns {ReclaimClient} Configured Reclaim client
 */
function createReclaimClient() {
  try {
    return new ReclaimClient(CONFIG.RECLAIM.APP_ID, CONFIG.RECLAIM.APP_SECRET);
  } catch (error) {
    throw new Error(`Failed to create Reclaim client: ${error.message}`);
  }
}

/**
 * Generates a zero-knowledge proof for Stellar price data
 * @param {ReclaimClient} reclaimClient - The Reclaim client instance
 * @returns {Promise<Object>} The generated proof
 */
async function generateStellarPriceProof(reclaimClient) {
  const url = CONFIG.API.COINGECKO_STELLAR_PRICE;

  console.log(`Fetching Stellar price from: ${url}`);

  try {
    const proof = await reclaimClient.zkFetch(
      url,
      { method: 'GET' },
      {
        responseMatches: [
          {
            type: 'regex',
            value: '\\{"stellar":\\{"usd":(?<price>[\\d\\.]+)\\}\\}',
          },
        ],
      }
    );

    console.log('✅ Proof generated successfully');
    console.log(
      `📊 Extracted price: $${proof.extractedParameterValues?.price || 'N/A'}`
    );

    return proof;
  } catch (error) {
    throw new Error(`Failed to generate proof: ${error.message}`);
  }
}

/**
 * Saves the proof to a JSON file
 * @param {Object} proof - The proof object to save
 * @param {string} outputPath - Path where to save the proof
 */
function saveProof(proof, outputPath) {
  try {
    const proofData = JSON.stringify(proof, null, 2);
    fs.writeFileSync(outputPath, proofData);
    console.log(`💾 Proof saved to: ${outputPath}`);
  } catch (error) {
    throw new Error(`Failed to save proof: ${error.message}`);
  }
}

/**
 * Main function to request and save a proof
 * @param {string} outputPath - Path where the proof will be saved
 */
export async function requestProof(outputPath = CONFIG.PATHS.PROOF_FILE) {
  try {
    console.log('🚀 Starting proof request process...');

    // Validate inputs
    validateOutputPath(outputPath);

    // Create Reclaim client
    const reclaimClient = createReclaimClient();

    // Generate proof
    const proof = await generateStellarPriceProof(reclaimClient);

    // Save proof
    saveProof(proof, outputPath);

    console.log('✅ Proof request completed successfully!');
    return proof;
  } catch (error) {
    console.error('❌ Error requesting proof:', error.message);
    throw error;
  }
}

/**
 * CLI entry point
 */
async function main() {
  try {
    const outputPath = process.argv[2] || CONFIG.PATHS.PROOF_FILE;
    await requestProof(outputPath);
    process.exit(0);
  } catch (error) {
    console.error('❌ Fatal error:', error.message);
    process.exit(1);
  }
}

// Run if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
