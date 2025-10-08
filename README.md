# 🌟 zkFetch Stellar Example

A comprehensive demonstration of zero-knowledge proof generation and verification using the Reclaim Protocol integrated with the Stellar blockchain. This project showcases how to fetch cryptocurrency price data with cryptographic proofs and verify them on-chain using Soroban smart contracts.

## 🚀 Features

- **Zero-Knowledge Proof Generation**: Generate cryptographic proofs for external API data
- **Stellar Blockchain Integration**: Verify proofs on Stellar testnet using Soroban contracts
- **Cryptocurrency Price Feeds**: Fetch real-time Stellar (XLM) price data from CoinGecko
- **Comprehensive Testing**: Full test suite with utility function validation
- **Modern Development Setup**: ESLint, Prettier, and automated testing
- **CLI Interface**: Easy-to-use command-line interface for all operations

## 📋 Prerequisites

- Node.js >= 18.0.0
- npm or yarn package manager
- Stellar testnet account with XLM for transaction fees
- Basic understanding of blockchain and zero-knowledge proofs

## 🛠️ Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/zkfetch-stellar-example.git
   cd zkfetch-stellar-example
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Download required ZK files**
   ```bash
   npm run download-zk-files
   ```

4. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env file with your Stellar seedphrase
   ```

5. **Run setup script (optional)**
   ```bash
   npm run setup
   ```

## ⚙️ Configuration

### Environment Variables

Create a `.env` file in the project root:

```env
# Stellar Wallet Configuration
SEEDPHRASE=your twelve word seedphrase goes here for stellar wallet generation

# Optional: Override default network settings
# NETWORK_URL=https://horizon-testnet.stellar.org
# SOROBAN_RPC_URL=https://soroban-testnet.stellar.org
# CONTRACT_ID=CB5MLBRA5FOCU4ZE557UKHYIKA6ASE6U6ZNK4WVBMWZ7G6IOQMSSWCXQ
```

### Application Configuration

The application uses a centralized configuration system in `src/config.js`:

- **Reclaim Protocol**: APP_ID and APP_SECRET for proof generation
- **Stellar Network**: Testnet configuration and contract details
- **API Endpoints**: CoinGecko API for price data
- **File Paths**: Default locations for proof files

## 🎯 Usage

### Command Line Interface

```bash
# Generate a new proof
npm run request-proof

# Verify existing proof on blockchain
npm run verify-proof

# Run complete workflow (request + verify)
npm start workflow

# Display application information
npm start info
```

### Programmatic Usage

```javascript
import { ZkFetchStellarApp } from './src/index.js';

const app = new ZkFetchStellarApp();

// Request a new proof
const proof = await app.requestStellarPriceProof();

// Verify proof on blockchain
const txHash = await app.verifyProofOnStellar();

// Run complete workflow
const result = await app.runCompleteWorkflow();
```

### Individual Module Usage

```javascript
import { requestProof } from './src/requestProof.js';
import { verifyProof } from './src/verifyProof.js';

// Request proof with custom output path
const proof = await requestProof('./custom-proof.json');

// Verify proof with custom file path
const txHash = await verifyProof('./custom-proof.json');
```

## 🧪 Testing

### Run Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### Test Categories

- **Proof Structure Validation**: Validates proof format and required fields
- **Signature Verification**: Ensures cryptographic signatures are valid
- **Utility Function Tests**: Tests all helper functions with edge cases
- **Configuration Tests**: Validates application configuration

## 📁 Project Structure

```
zkfetch-stellar-example/
├── src/
│   ├── config.js          # Centralized configuration
│   ├── index.js           # Main application entry point
│   ├── requestProof.js     # Proof generation module
│   ├── verifyProof.js      # Blockchain verification module
│   ├── utils.js           # Utility functions
│   └── proof.json         # Generated proof file
├── tests/
│   └── proof.test.js      # Comprehensive test suite
├── scripts/
│   └── setup.js           # Setup automation script
├── .env.example           # Environment variables template
├── .eslintrc.json         # ESLint configuration
├── .prettierrc            # Prettier configuration
├── .gitignore             # Git ignore rules
└── package.json           # Project dependencies and scripts
```

## 🔧 Development

### Code Quality

```bash
# Lint code
npm run lint

# Fix linting issues
npm run lint:fix

# Format code
npm run format

# Check formatting
npm run format:check
```

### Available Scripts

- `npm start` - Run main application
- `npm run request-proof` - Generate new proof
- `npm run verify-proof` - Verify existing proof
- `npm test` - Run test suite
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Run tests with coverage
- `npm run lint` - Lint code
- `npm run lint:fix` - Fix linting issues
- `npm run format` - Format code
- `npm run setup` - Run setup script

## 🌐 Network Configuration

### Stellar Testnet

- **Network**: Testnet
- **Horizon URL**: https://horizon-testnet.stellar.org
- **Soroban RPC**: https://soroban-testnet.stellar.org
- **Contract ID**: CB5MLBRA5FOCU4ZE557UKHYIKA6ASE6U6ZNK4WVBMWZ7G6IOQMSSWCXQ
- **Explorer**: https://stellar.expert/explorer/testnet/

### API Endpoints

- **CoinGecko Stellar Price**: https://api.coingecko.com/api/v3/simple/price?ids=stellar&vs_currencies=usd

## 🔍 How It Works

### 1. Proof Generation

The application uses the Reclaim Protocol to generate zero-knowledge proofs:

1. **API Request**: Fetches Stellar price data from CoinGecko
2. **Data Extraction**: Uses regex patterns to extract price information
3. **Proof Generation**: Creates cryptographic proof of the data
4. **File Storage**: Saves proof to JSON file

### 2. Proof Verification

The verification process submits proofs to the Stellar blockchain:

1. **Proof Loading**: Reads and validates proof file
2. **Data Preparation**: Formats proof data for blockchain submission
3. **Transaction Creation**: Builds Stellar transaction with Soroban contract call
4. **Blockchain Submission**: Signs and submits transaction to testnet

### 3. Smart Contract Integration

The application interacts with a Soroban smart contract that:
- Verifies cryptographic signatures
- Validates proof structure
- Stores verification results on-chain

## 🚨 Troubleshooting

### Common Issues

1. **Missing .env file**
   ```bash
   cp .env.example .env
   # Edit with your seedphrase
   ```

2. **Insufficient XLM balance**
   - Ensure your Stellar testnet account has XLM for transaction fees
   - Get testnet XLM from Stellar Friendbot

3. **ZK files not downloaded**
   ```bash
   npm run download-zk-files
   ```

4. **Network connection issues**
   - Check internet connection
   - Verify Stellar testnet is accessible

### Error Messages

- `Missing required environment variables`: Check your .env file
- `Proof file not found`: Run `npm run request-proof` first
- `Failed to create Stellar wallet`: Verify your seedphrase format
- `Transaction failed`: Check account balance and network status

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the ISC License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Reclaim Protocol](https://reclaimprotocol.org/) for zero-knowledge proof infrastructure
- [Stellar Development Foundation](https://stellar.org/) for blockchain platform
- [CoinGecko](https://coingecko.com/) for cryptocurrency price data
- [Soroban](https://soroban.stellar.org/) for smart contract platform

## 📚 Additional Resources

- [Reclaim Protocol Documentation](https://docs.reclaimprotocol.org/)
- [Stellar Documentation](https://developers.stellar.org/)
- [Soroban Documentation](https://soroban.stellar.org/docs)
- [Zero-Knowledge Proofs](https://en.wikipedia.org/wiki/Zero-knowledge_proof)

## 🔗 Links

- **Repository**: https://github.com/your-username/zkfetch-stellar-example
- **Issues**: https://github.com/your-username/zkfetch-stellar-example/issues
- **Stellar Explorer**: https://stellar.expert/explorer/testnet/
- **Reclaim Protocol**: https://reclaimprotocol.org/