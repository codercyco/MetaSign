# MetaSign - Blockchain Document Signing & Verification

**A secure Web3 dApp for cryptographically signing and verifying documents on the blockchain**

![MetaSign](https://img.shields.io/badge/Built%20with-React%20%2B%20Solidity-blue)
![License](https://img.shields.io/badge/License-MIT-green)
![Security](https://img.shields.io/badge/Security-Production%20Ready-brightgreen)

## Features

### **Cryptographic Security**
- **ECDSA Signature Verification** - Industry-standard cryptographic validation
- **Anti-Replay Protection** - Nonce-based system prevents signature reuse
- **Tamper Detection** - Immediate detection of document modifications
- **Legal Non-repudiation** - Cryptographic proof of document authenticity

### **Modern User Experience**
- **Dark/Light Mode**
- **Drag & Drop File Upload** 
- **Responsive Design** 
- **Real-time Validation**

### **Web3 Integration**
- **MetaMask Integration** - Seamless wallet connection
- **Multi-Network Support** - Configurable for any EVM-compatible chain
- **Gas Optimized** - Efficient smart contract design
- **Transaction Tracking** - Direct links to blockchain explorer

## Quick Start

### Prerequisites
- **Node.js** v18 or higher
- **MetaMask** browser extension


### Installation

```bash
# Clone the repository
git clone https://github.com/codercyco/MetaSign.git
cd MetaSign

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env

# Start development server
npm run dev
```

### Environment Configuration

Update your `.env` file with:

```env
# Smart Contract Address (deploy contract first)
VITE_CONTRACT_ADDRESS=0xYourContractAddress

# Blockchain Network (Hoodi Testnet by default)
VITE_CHAIN_ID=0x4c614e
VITE_CHAIN_NAME=Hoodi Testnet
VITE_RPC_URL=https://rpc.hoodi.io
VITE_EXPLORER_URL=https://explorer.hoodi.io
```

## Usage Guide

### 1. **Connect Wallet**
- Click "Connect Wallet" button
- Approve MetaMask connection


### 2. **Sign Document**
- Upload file via drag-and-drop or click
- Click "Sign Document"
- Confirm transaction in MetaMask
- Receive cryptographic proof

### 3. **Verify Document**
- Upload document or paste hash
- View verification results
- Check cryptographic validity
- Confirm signer identity

### 4. **View History**
- Click "Load My Documents"
- Browse all signed documents
- Access transaction details

## Architecture

### Smart Contract
```
contracts/
├── MetaSign.sol          # Main contract with ECDSA verification
├── package.json          # OpenZeppelin dependencies
└── deploy.sol            # Deployment documentation
```

### Frontend Stack
```
src/
├── App.jsx              # Main React component
├── App.css              # Custom styling
├── main.jsx             # Application entry point
└── index.css            # Tailwind CSS imports
```

### Key Technologies
- **React 18.3.1** - Modern UI framework
- **Vite 6.0.5** - Fast build tool
- **Ethers.js 6.13.4** - Ethereum interaction
- **Tailwind CSS 3.4.17** - Utility-first styling
- **Solidity ^0.8.19** - Smart contract development

## Security Features

### **Cryptographic Validation**
- ECDSA signature recovery and verification
- Message hash construction with replay protection
- OpenZeppelin security standards compliance

### **Attack Prevention**
- **Replay Attack Protection** - Nonce-based system
- **Input Validation** - Comprehensive parameter checking
- **Access Control** - Proper function visibility
- **Gas Optimization** - Custom errors for efficiency

## Documentation

### Additional Resources
- [`SETUP.md`](SETUP.md) - Detailed environment setup guide
- [`contracts/README.md`](contracts/README.md) - Smart contract documentation

### API Reference

#### Smart Contract Functions
```solidity
// Sign a document
function signDocument(bytes32 documentHash, string documentTitle, bytes signature, uint256 nonce)

// Verify a document (view function - no gas)
function verifyDocument(bytes32 documentHash) returns (bool exists, address signer, uint256 timestamp, string documentTitle, bytes signature, bool signatureValid)

// Get signer's nonce
function getSignerNonce(address signer) returns (uint256)

// Get documents by signer
function getDocumentsBySigner(address signer) returns (bytes32[])
```

## Contributing

We welcome contributions! Please follow these steps:

1. **Fork the repository**
2. **Create feature branch** (`git checkout -b feature/amazing-feature`)
3. **Commit changes** (`git commit -m 'Add amazing feature'`)
4. **Push to branch** (`git push origin feature/amazing-feature`)
5. **Open Pull Request**

### Development Guidelines
- Follow existing code style
- Add tests for new features
- Update documentation
- Ensure security best practices

## License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- **OpenZeppelin** - Security-first smart contract library
- **Ethers.js** - Ethereum JavaScript library
- **Tailwind CSS** - Utility-first CSS framework
- **Vite** - Next generation frontend tooling

## Support

- **Issues**: [GitHub Issues](https://github.com/codercyco/MetaSign/issues)
- **Discussions**: [GitHub Discussions](https://github.com/codercyco/MetaSign/discussions)
- **Security**: [Report security issues privately](https://www.linkedin.com/in/isharadeshapriya/)

---

<div align="center">

[🌐 Live Demo](https://metasign.vercel.app) • [📚 Documentation](https://github.com/codercyco/MetaSign/wiki) • [🐛 Report Bug](https://github.com/codercyco/MetaSign/issues)

</div>
