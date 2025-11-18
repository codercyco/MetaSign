# MetaSign Environment Setup

This guide explains how to configure environment variables for the MetaSign dApp.

## Quick Setup

1. **Copy the example environment file:**
   ```bash
   cp .env.example .env
   ```

2. **Edit the `.env` file** with your actual values:
   ```bash
   nano .env  # or use your preferred editor
   ```

## Required Environment Variables

### 🔧 Smart Contract Configuration

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_CONTRACT_ADDRESS` | Your deployed smart contract address | `0x1234567890abcdef...` |

### 🌐 Blockchain Network Settings

| Variable | Description | Example | Default |
|----------|-------------|---------|---------|
| `VITE_CHAIN_ID` | Target blockchain chain ID (hex format) | `0x4c614e` | `0x4c614e` (Hoodi) |
| `VITE_CHAIN_NAME` | Human-readable network name | `Ethereum Mainnet` | `Hoodi Testnet` |
| `VITE_RPC_URL` | RPC endpoint for blockchain connection | `https://mainnet.infura.io/v3/YOUR_KEY` | Hoodi public node |
| `VITE_EXPLORER_URL` | Block explorer base URL | `https://etherscan.io` | `https://explorer.hoodi.io` |

### 🚀 Development Settings

| Variable | Description | Values | Default |
|----------|-------------|--------|---------|
| `NODE_ENV` | Environment mode | `development` \| `production` | `development` |

## Common Network Configurations

### Ethereum Mainnet
```env
VITE_CHAIN_ID=0x1
VITE_CHAIN_NAME=Ethereum Mainnet
VITE_RPC_URL=https://mainnet.infura.io/v3/YOUR_INFURA_KEY
VITE_EXPLORER_URL=https://etherscan.io
```

### Hoodi Testnet (Default)
```env
VITE_CHAIN_ID=0x4c614e
VITE_CHAIN_NAME=Hoodi Testnet
VITE_RPC_URL=https://rpc.hoodi.io
VITE_EXPLORER_URL=https://explorer.hoodi.io
```

### Ethereum Sepolia Testnet
```env
VITE_CHAIN_ID=0xaa36a7
VITE_CHAIN_NAME=Sepolia
VITE_RPC_URL=https://sepolia.infura.io/v3/YOUR_INFURA_KEY
VITE_EXPLORER_URL=https://sepolia.etherscan.io
```

### Polygon Mainnet
```env
VITE_CHAIN_ID=0x89
VITE_CHAIN_NAME=Polygon
VITE_RPC_URL=https://polygon-rpc.com
VITE_EXPLORER_URL=https://polygonscan.com
```

### Local Development (Hardhat/Ganache)
```env
VITE_CHAIN_ID=0x539
VITE_CHAIN_NAME=Localhost
VITE_RPC_URL=http://localhost:8545
VITE_EXPLORER_URL=http://localhost:8545
```

## Setup Steps

### 1. Deploy Smart Contract
Before configuring the dApp, you need to deploy the MetaSign smart contract:

```solidity
// Example contract deployment address after deployment
VITE_CONTRACT_ADDRESS=0x742d35cc64c87dd4a3b3c19c7d4b8f3f4f4f4f4f
```

### 2. Configure RPC Provider
Choose an RPC provider:
- **Free Options**: Public nodes (may be rate-limited)
- **Recommended**: [Infura](https://infura.io), [Alchemy](https://alchemy.com), [QuickNode](https://quicknode.com)

### 3. Verify Configuration
After setting up `.env`, start the development server:

```bash
npm run dev
```

Check the contract info panel in the dApp to verify:
- ✅ Contract address is displayed (not "⚠️ Not configured")
- ✅ Network name and Chain ID match your settings
- ✅ Wallet connection works with your target network

## Environment Security

### ✅ Safe Practices
- Keep `.env` files out of version control
- Only use `VITE_` prefix for client-side variables
- Use different contracts for development/staging/production
- Regularly rotate API keys

### ❌ Never Store in Environment Variables
- Private keys or mnemonic phrases
- Secret API keys that should remain server-side
- Sensitive user data

### Git Configuration
Add to your `.gitignore`:
```gitignore
# Environment files
.env
.env.local
.env.development.local
.env.test.local
.env.production.local
```

## Troubleshooting

### "Contract not configured" Error
- Verify `VITE_CONTRACT_ADDRESS` is set in `.env`
- Ensure the contract is deployed on your target network
- Restart the dev server after changing `.env`

### Wrong Network Error
- Check `VITE_CHAIN_ID` matches your target blockchain
- Verify the chain ID is in hexadecimal format (e.g., `0x1`, not `1`)
- Ensure your RPC URL points to the correct network

### Transaction Links Not Working
- Confirm `VITE_EXPLORER_URL` matches your network's explorer
- Check that the explorer supports the `/tx/` path format

### MetaMask Network Not Found
- The dApp will automatically add the network configuration to MetaMask
- Verify RPC URL is accessible and correct
- Check that the chain ID is unique and valid

## Production Deployment

For production deployments, consider:

1. **Use dedicated RPC endpoints** with higher rate limits
2. **Deploy contracts to mainnet** with proper testing
3. **Set up monitoring** for contract interactions
4. **Use environment-specific builds**:
   ```bash
   NODE_ENV=production npm run build
   ```

## Support

If you encounter issues with environment setup:
1. Check the browser console for detailed error messages
2. Verify all required variables are set in `.env`
3. Test with a known working configuration (e.g., Holesky testnet)
4. Ensure your wallet is connected to the correct network

---

**Next Steps**: After environment setup, you can deploy the smart contract and start using the MetaSign dApp for document signing and verification.