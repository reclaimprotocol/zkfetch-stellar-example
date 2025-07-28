import * as StellarSdk from '@stellar/stellar-sdk';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as Reclaim from '@reclaimprotocol/js-sdk';
import StellarHDWallet from 'stellar-hd-wallet'
import * as utils from "./utils.js"
dotenv.config({ path: '../.env' })

const server = new StellarSdk.Horizon.Server('https://horizon-testnet.stellar.org');

const CONTRACT_ID = 'CB5MLBRA5FOCU4ZE557UKHYIKA6ASE6U6ZNK4WVBMWZ7G6IOQMSSWCXQ';
const SOROBAN_RPC_URL = 'https://soroban-testnet.stellar.org';
const EXPLORER_LINK = 'https://stellar.expert/explorer/testnet/tx/'

const FUNCTION_NAME = 'verify_proof';

export const TESTNET_DETAILS = {
    network: "TESTNET",
    networkUrl: "https://horizon-testnet.stellar.org",
    networkPassphrase: "Test SDF Network ; September 2015",
};
const BASE_FEE = "100";

const wallet = StellarHDWallet.fromMnemonic(process.env.SEEDPHRASE);
const SOURCE_SECRET_KEY = wallet.getSecret(0); // This gives the 'S'-starting secret key 
const sourceKeypair = StellarSdk.Keypair.fromSecret(SOURCE_SECRET_KEY);

async function main() {

    try {

        const proofData = fs.readFileSync('./proof.json');
        const proofJson = JSON.parse(proofData);
        const proof = Reclaim.transformForOnchain(proofJson)

        let recId = utils.getRecId(proof.signedClaim.signatures[0]);

        proof.signedClaim.signatures[0] = utils.formatSignature(
            proof.signedClaim.signatures[0]
        );

        const serializedClaim = utils.getSerializedClaim(proof);

        const message = utils.getHash(serializedClaim);

        const signature = Buffer.from(proof.signedClaim.signatures[0], "hex");

        const publicKey = sourceKeypair.publicKey();

        const contract = new StellarSdk.Contract(
            CONTRACT_ID
        );

        const pass = TESTNET_DETAILS.networkPassphrase;

        const lAccount = await server.loadAccount(publicKey)

        const account = new StellarSdk.Account(publicKey, lAccount.sequence);

        const txBuilder = new StellarSdk.TransactionBuilder(account, {
            fee: BASE_FEE,
            networkPassphrase: pass,
        });

        const tx = txBuilder
            .addOperation(
                contract.call(
                    FUNCTION_NAME,
                    ...[
                        StellarSdk.nativeToScVal(message, { type: 'bytes' }),
                        StellarSdk.nativeToScVal(signature, { type: 'bytes' }),
                        StellarSdk.nativeToScVal(recId, { type: "u32" }),
                    ]
                )
            )
            .setTimeout(StellarSdk.TimeoutInfinite)
            .build();

        const rpcServer = new StellarSdk.rpc.Server(SOROBAN_RPC_URL);

        const preparedTransaction = await rpcServer.prepareTransaction(tx);

        // const xdr = preparedTransaction.toXDR();

        preparedTransaction.sign(sourceKeypair)

        const sendResult = await rpcServer.sendTransaction(preparedTransaction);

        console.log('Transaction Link:', EXPLORER_LINK + sendResult.hash);

        process.exit(0);
    } catch (e) {
        console.error("Error verifying proof:", e.message);
        process.exit(1);
    }
}

// Run the verification function
main();
