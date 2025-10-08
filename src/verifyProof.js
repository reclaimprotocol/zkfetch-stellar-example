/**
 * Verify Proof Module
 *
 * This module handles the verification of zero-knowledge proofs on the Stellar blockchain
 * using Soroban smart contracts.
 */

import * as StellarSdk from '@stellar/stellar-sdk';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as Reclaim from '@reclaimprotocol/js-sdk';
import StellarHDWallet from 'stellar-hd-wallet';
import * as utils from './utils.js';
import { CONFIG, validateEnvironment, getStellarServer } from './config.js';

// Load environment variables
dotenv.config();

// Validate environment on module load
validateEnvironment();

/**
 * Creates a Stellar wallet from the seedphrase
 * @returns {Object} Stellar keypair and wallet instance
 */
function createStellarWallet() {
  try {
    const wallet = StellarHDWallet.fromMnemonic(CONFIG.ENV.SEEDPHRASE);
    const secretKey = wallet.getSecret(0); // This gives the 'S'-starting secret key
    const keypair = StellarSdk.Keypair.fromSecret(secretKey);

    return { wallet, keypair };
  } catch (error) {
    throw new Error(`Failed to create Stellar wallet: ${error.message}`);
  }
}

/**
 * Loads and validates the proof file
 * @param {string} proofPath - Path to the proof file
 * @returns {Object} Parsed and transformed proof
 */
function loadProof(proofPath) {
  try {
    if (!fs.existsSync(proofPath)) {
      throw new Error(`Proof file not found: ${proofPath}`);
    }

    const proofData = fs.readFileSync(proofPath, 'utf8');
    const proofJson = JSON.parse(proofData);

    // Validate proof structure
    if (!proofJson.signatures || !proofJson.signatures.length) {
      throw new Error('Invalid proof: missing signatures');
    }

    const proof = Reclaim.transformForOnchain(proofJson);
    console.log('✅ Proof loaded and validated');

    return proof;
  } catch (error) {
    throw new Error(`Failed to load proof: ${error.message}`);
  }
}

/**
 * Prepares the proof data for blockchain submission
 * @param {Object} proof - The transformed proof
 * @returns {Object} Prepared proof data
 */
function prepareProofData(proof) {
  try {
    const recId = utils.getRecId(proof.signedClaim.signatures[0]);
    const formattedSignature = utils.formatSignature(
      proof.signedClaim.signatures[0]
    );
    const serializedClaim = utils.getSerializedClaim(proof);
    const message = utils.getHash(serializedClaim);
    const signature = Buffer.from(formattedSignature, 'hex');

    return {
      message,
      signature,
      recId,
    };
  } catch (error) {
    throw new Error(`Failed to prepare proof data: ${error.message}`);
  }
}

/**
 * Creates and submits the verification transaction
 * @param {Object} keypair - Stellar keypair
 * @param {Object} proofData - Prepared proof data
 * @returns {Promise<string>} Transaction hash
 */
async function submitVerificationTransaction(keypair, proofData) {
  try {
    const server = await getStellarServer();
    const publicKey = keypair.publicKey();

    console.log(
      `🔗 Connecting to Stellar network: ${CONFIG.TESTNET_DETAILS.networkUrl}`
    );

    // Load account
    const accountResponse = await server.loadAccount(publicKey);
    const account = new StellarSdk.Account(publicKey, accountResponse.sequence);

    console.log(
      `📊 Account balance: ${accountResponse.balances[0]?.balance || '0'} XLM`
    );

    // Create contract instance
    const contract = new StellarSdk.Contract(CONFIG.STELLAR.CONTRACT_ID);

    // Build transaction
    const txBuilder = new StellarSdk.TransactionBuilder(account, {
      fee: CONFIG.STELLAR.BASE_FEE,
      networkPassphrase: CONFIG.TESTNET_DETAILS.networkPassphrase,
    });

    const tx = txBuilder
      .addOperation(
        contract.call(
          CONFIG.STELLAR.FUNCTION_NAME,
          ...[
            StellarSdk.nativeToScVal(proofData.message, { type: 'bytes' }),
            StellarSdk.nativeToScVal(proofData.signature, { type: 'bytes' }),
            StellarSdk.nativeToScVal(proofData.recId, { type: 'u32' }),
          ]
        )
      )
      .setTimeout(StellarSdk.TimeoutInfinite)
      .build();

    // Prepare and sign transaction
    const rpcServer = new StellarSdk.rpc.Server(CONFIG.STELLAR.SOROBAN_RPC_URL);
    const preparedTransaction = await rpcServer.prepareTransaction(tx);

    console.log('✍️ Signing transaction...');
    preparedTransaction.sign(keypair);

    // Submit transaction
    console.log('📤 Submitting transaction to blockchain...');
    const sendResult = await rpcServer.sendTransaction(preparedTransaction);

    console.log('✅ Transaction submitted successfully!');
    console.log(
      `🔗 Transaction Link: ${CONFIG.STELLAR.EXPLORER_LINK}${sendResult.hash}`
    );

    return sendResult.hash;
  } catch (error) {
    throw new Error(`Failed to submit transaction: ${error.message}`);
  }
}

/**
 * Main function to verify a proof on the Stellar blockchain
 * @param {string} proofPath - Path to the proof file
 */
export async function verifyProof(proofPath = CONFIG.PATHS.PROOF_FILE) {
  try {
    console.log('🚀 Starting proof verification process...');

    // Create wallet
    const { keypair } = createStellarWallet();
    console.log(`👛 Wallet address: ${keypair.publicKey()}`);

    // Load proof
    const proof = loadProof(proofPath);

    // Prepare proof data
    const proofData = prepareProofData(proof);

    // Submit transaction
    const txHash = await submitVerificationTransaction(keypair, proofData);

    console.log('✅ Proof verification completed successfully!');
    return txHash;
  } catch (error) {
    console.error('❌ Error verifying proof:', error.message);
    throw error;
  }
}

/**
 * CLI entry point
 */
async function main() {
  try {
    const proofPath = process.argv[2] || CONFIG.PATHS.PROOF_FILE;
    await verifyProof(proofPath);
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
