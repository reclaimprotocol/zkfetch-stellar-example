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
 * Generates a zero-knowledge proof for Trading Economics countries GDP data
 * @param {ReclaimClient} reclaimClient - The Reclaim client instance
 * @returns {Promise<Object>} The generated proof
 */
async function generateTradingEconomicsProof(reclaimClient) {
  const url = CONFIG.API.TRADING_ECONOMICS_COUNTRIES;

  console.log(`Fetching countries GDP data from: ${url}`);

  try {
    const proof = await reclaimClient.zkFetch(
      url,
      {
        method: 'GET',
        headers: {
          'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
          'accept-language': 'en-US,en;q=0.9',
          'priority': 'u=0, i',
          'sec-ch-ua': '"Google Chrome";v="141", "Not?A_Brand";v="8", "Chromium";v="141"',
          'sec-ch-ua-mobile': '?0',
          'sec-ch-ua-platform': '"macOS"',
          'sec-fetch-dest': 'document',
          'sec-fetch-mode': 'navigate',
          'sec-fetch-site': 'none',
          'sec-fetch-user': '?1',
          'upgrade-insecure-requests': '1'
        },
        context: {
          contextAddress: '0x0',
          contextMessage: 'countries gdp'
        }
      },
      {
        responseMatches: [{
          type: 'regex',
          value: '(?:<a class="matrix-country"[^>]*>(?<country1>[^<]+)<\\/a><\\/td>\\s*<td data-heatmap-value=\'\\d+\'><a[^>]*>(?<gdp1>\\d+)<\\/a>)(?:.*?<a class="matrix-country"[^>]*>(?<country2>[^<]+)<\\/a><\\/td>\\s*<td data-heatmap-value=\'\\d+\'><a[^>]*>(?<gdp2>\\d+)<\\/a>){0,1}(?:.*?<a class="matrix-country"[^>]*>(?<country3>[^<]+)<\\/a><\\/td>\\s*<td data-heatmap-value=\'\\d+\'><a[^>]*>(?<gdp3>\\d+)<\\/a>){0,1}(?:.*?<a class="matrix-country"[^>]*>(?<country4>[^<]+)<\\/a><\\/td>\\s*<td data-heatmap-value=\'\\d+\'><a[^>]*>(?<gdp4>\\d+)<\\/a>){0,1}(?:.*?<a class="matrix-country"[^>]*>(?<country5>[^<]+)<\\/a><\\/td>\\s*<td data-heatmap-value=\'\\d+\'><a[^>]*>(?<gdp5>\\d+)<\\/a>){0,1}'
        }],
        responseRedactions: []
      }
    );

    console.log('✅ Trading Economics proof generated successfully');
    console.log('📊 Extracted countries and GDP data:');
    
    const extractedValues = proof.extractedParameterValues || {};
    for (let i = 1; i <= 5; i++) {
      const country = extractedValues[`country${i}`];
      const gdp = extractedValues[`gdp${i}`];
      if (country && gdp) {
        console.log(`   ${country}: $${gdp}`);
      }
    }

    return proof;
  } catch (error) {
    throw new Error(`Failed to generate Trading Economics proof: ${error.message}`);
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
 * @param {string} proofType - Type of proof to generate ('stellar' or 'trading-economics')
 */
export async function requestProof(outputPath = CONFIG.PATHS.PROOF_FILE, proofType = 'stellar') {
  try {
    console.log(`🚀 Starting ${proofType} proof request process...`);

    // Validate inputs
    validateOutputPath(outputPath);

    // Create Reclaim client
    const reclaimClient = createReclaimClient();

    // Generate proof based on type
    let proof;
    switch (proofType) {
      case 'stellar':
        proof = await generateStellarPriceProof(reclaimClient);
        break;
      case 'trading-economics':
        proof = await generateTradingEconomicsProof(reclaimClient);
        break;
      default:
        throw new Error(`Unknown proof type: ${proofType}. Supported types: 'stellar', 'trading-economics'`);
    }

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
    const proofType = process.argv[2] || 'stellar';
    const outputPath = process.argv[3] || CONFIG.PATHS.PROOF_FILE;
    
    console.log(`Available proof types: 'stellar', 'trading-economics'`);
    console.log(`Using proof type: ${proofType}`);
    
    await requestProof(outputPath, proofType);
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
