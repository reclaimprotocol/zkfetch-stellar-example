/**
 * Verify Proof Module
 *
 * This module handles the verification of zero-knowledge proofs on the Stellar blockchain
 * using Soroban smart contracts.
 */

import StellarSdk from 'stellar-sdk';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as Reclaim from '@reclaimprotocol/js-sdk';
import StellarHDWallet from 'stellar-hd-wallet';
import * as utils from './utils.js';
import { CONFIG, validateEnvironment } from './config.js';

// Load environment variables without extra console output
dotenv.config({ quiet: true });

// Validate environment on module load
validateEnvironment();

function bytesN(buffer, length) {
  if (!(buffer instanceof Buffer || buffer instanceof Uint8Array)) {
    throw new Error('Expected Buffer or Uint8Array');
  }

  if (buffer.length !== length) {
    throw new Error(`Expected ${length} bytes, got ${buffer.length}`);
  }

  return StellarSdk.nativeToScVal(Buffer.from(buffer), { type: 'bytes' });
}

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
    console.log('Proof loaded and validated');

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
    const rpcServer = new StellarSdk.rpc.Server(CONFIG.STELLAR_TESTNET.SOROBAN_RPC_URL);
    // const server = await getStellarServer();
    const publicKey = keypair.publicKey();

    console.log(
      `Connecting to Stellar network: ${CONFIG.TESTNET_DETAILS.networkUrl}`
    );

    // Load account
    const accountResponse = await rpcServer.getAccount(publicKey);
    // const account = new StellarSdk.Account(publicKey, accountResponse.sequence);

    // console.log(
    //   `Account balance: ${accountResponse.balances[0]?.balance || '0'} XLM`
    // );

    // Create contract instance
    const contract = new StellarSdk.Contract(CONFIG.STELLAR_TESTNET.CONTRACT_ID);

    // Build transaction
    const txBuilder = new StellarSdk.TransactionBuilder(accountResponse, {
      fee: CONFIG.STELLAR_TESTNET.BASE_FEE,
      networkPassphrase: CONFIG.TESTNET_DETAILS.networkPassphrase,
    });

    const tx = txBuilder
      .addOperation(
        contract.call(
    CONFIG.STELLAR_TESTNET.FUNCTION_NAME,
    bytesN(proofData.message, 32),
    bytesN(proofData.signature.slice(0, 64), 64),
    StellarSdk.nativeToScVal(proofData.recId, { type: 'u32' })
  )
      )
      .setTimeout(StellarSdk.TimeoutInfinite)
      .build();

    // Prepare and sign transaction
    const preparedTransaction = await rpcServer.prepareTransaction(tx);

    console.log('Signing transaction...');
    preparedTransaction.sign(keypair);

    // Submit transaction
    console.log('Submitting transaction to blockchain...');
    const sendResult = await rpcServer.sendTransaction(preparedTransaction);

    console.log('Transaction submitted successfully!');
    console.log(
      `Transaction Link: ${CONFIG.STELLAR_TESTNET.EXPLORER_LINK}${sendResult.hash}`
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
    console.log('Starting proof verification process...');

    // Load proof first (validate before wallet creation)
    const proof = loadProof(proofPath);

    // Prepare proof data
    const proofData = prepareProofData(proof);

    // Create wallet
    const { keypair } = createStellarWallet();
    console.log(`Wallet address: ${keypair.publicKey()}`);

    // Submit transaction
    const txHash = await submitVerificationTransaction(keypair, proofData);

    console.log('Proof verification completed successfully!');
    return txHash;
  } catch (error) {
    console.error('Error verifying proof:', error.message);
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
    console.error('Fatal error:', error.message);
    process.exit(1);
  }
}

// Export for testing
export { main, bytesN };

// Run if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
