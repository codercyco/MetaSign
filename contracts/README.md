# MetaSign Smart Contract

This directory contains the Solidity smart contract for the MetaSign document signing system.

## Contract Overview

**File**: `MetaSign.sol`  
**License**: MIT  
**Solidity Version**: ^0.8.19

## Features

### Core Functions

1. **`signDocument(bytes32 documentHash, string documentTitle, bytes signature)`**
   - Stores document hash, title, and digital signature on blockchain
   - Records signer address and timestamp automatically
   - Prevents duplicate signatures for same document hash
   - Emits `DocumentSigned` event

2. **`verifyDocument(bytes32 documentHash)`**
   - Returns complete document record (exists, signer, timestamp, title, signature)
   - View function (no gas cost for queries)
   - Used by dApp for document verification

3. **`getDocumentsBySigner(address signer)`**
   - Returns array of document hashes signed by specific address
   - Enables user document history functionality
   - View function (no gas cost)

### Additional Utility Functions

- `getSignedDocumentCount(address)` - Count of documents signed by address
- `documentExists(bytes32)` - Quick existence check
- `getDocumentInfo(bytes32)` - Document info without signature data
- `getContractInfo()` - Contract name and version

## Data Structures

### DocumentRecord Struct
```solidity
struct DocumentRecord {
    bool exists;           // Record existence flag
    address signer;        // Signer's Ethereum address
    uint256 timestamp;     // Unix timestamp of signing
    string documentTitle;  // Human-readable document name
    bytes signature;       // Digital signature of document hash
}
```

### Storage Mappings
- `mapping(bytes32 => DocumentRecord) public documents` - Document hash to record
- `mapping(address => bytes32[]) public documentsBySigner` - Signer to document list

## Security Features

### Input Validation
- Document hash cannot be zero/empty
- Document title cannot be empty string
- Digital signature cannot be empty
- Prevents duplicate document signing

### Immutability
- Once signed, document records cannot be modified
- Provides tamper-proof audit trail
- Blockchain-enforced non-repudiation

## Gas Optimization

- Uses `calldata` for external function parameters
- Efficient storage layout for structs
- View functions for read operations
- Events for off-chain indexing

## Deployment Instructions

### Prerequisites
```bash
npm install -g hardhat
npm install @openzeppelin/contracts
```

### Compile Contract
```bash
npx hardhat compile
```

### Deploy Script Example
```javascript
async function main() {
  const MetaSign = await ethers.getContractFactory("MetaSign");
  const metaSign = await MetaSign.deploy();
  await metaSign.deployed();
  
  console.log("MetaSign deployed to:", metaSign.address);
}
```

### Verification
```bash
npx hardhat verify --network <network> <contract-address>
```

## Integration with dApp

The contract ABI matches exactly with the dApp's `contractABI` in `src/App.jsx`:

### Required Functions (dApp Integration)
- `signDocument(bytes32,string,bytes)` → `nonpayable`
- `verifyDocument(bytes32)` → `view` returns `(bool,address,uint256,string,bytes)`
- `getDocumentsBySigner(address)` → `view` returns `bytes32[]`

### Environment Setup
After deployment, update `.env`:
```bash
VITE_CONTRACT_ADDRESS=0xYourDeployedContractAddress
```

## Usage Example

### Document Signing Flow
1. User uploads file in dApp
2. dApp computes `keccak256(fileContent)`
3. User wallet signs the hash → creates `signature`
4. dApp calls `signDocument(hash, title, signature)`
5. Transaction confirms → document is signed on-chain

### Document Verification Flow
1. User uploads file for verification
2. dApp computes `keccak256(fileContent)`
3. dApp calls `verifyDocument(hash)`
4. Contract returns signing details if document exists
5. dApp displays verification results

## Events

### DocumentSigned
```solidity
event DocumentSigned(
    bytes32 indexed documentHash,
    address indexed signer,
    string documentTitle,
    uint256 timestamp,
    bytes signature
);
```

### DocumentVerified
```solidity
event DocumentVerified(
    bytes32 indexed documentHash,
    address indexed verifier,
    bool exists
);
```

## Testing

Example test structure:
```javascript
describe("MetaSign", function() {
  it("Should sign a document", async function() {
    // Test signDocument functionality
  });
  
  it("Should verify a signed document", async function() {
    // Test verifyDocument functionality
  });
  
  it("Should prevent duplicate signing", async function() {
    // Test duplicate prevention
  });
});
```

## License

MIT License - see contract header for full license text.