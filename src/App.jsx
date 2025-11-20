import { useState, useEffect, useRef } from 'react';
import { ethers } from 'ethers';
import './App.css';

// Smart contract ABI (Updated for secure version)
const contractABI = [
  {
    "inputs": [
      {"internalType": "bytes32", "name": "documentHash", "type": "bytes32"},
      {"internalType": "string", "name": "documentTitle", "type": "string"},
      {"internalType": "bytes", "name": "signature", "type": "bytes"},
      {"internalType": "uint256", "name": "nonce", "type": "uint256"}
    ],
    "name": "signDocument",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "bytes32", "name": "documentHash", "type": "bytes32"}
    ],
    "name": "verifyDocument",
    "outputs": [
      {"internalType": "bool", "name": "exists", "type": "bool"},
      {"internalType": "address", "name": "signer", "type": "address"},
      {"internalType": "uint256", "name": "timestamp", "type": "uint256"},
      {"internalType": "string", "name": "documentTitle", "type": "string"},
      {"internalType": "bytes", "name": "signature", "type": "bytes"},
      {"internalType": "bool", "name": "signatureValid", "type": "bool"}
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "bytes32", "name": "documentHash", "type": "bytes32"}
    ],
    "name": "logVerification",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "address", "name": "signer", "type": "address"}
    ],
    "name": "getDocumentsBySigner",
    "outputs": [
      {"internalType": "bytes32[]", "name": "", "type": "bytes32[]"}
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "address", "name": "signer", "type": "address"}
    ],
    "name": "getSignerNonce",
    "outputs": [
      {"internalType": "uint256", "name": "", "type": "uint256"}
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "bytes32", "name": "documentHash", "type": "bytes32"}
    ],
    "name": "documentExists",
    "outputs": [
      {"internalType": "bool", "name": "", "type": "bool"}
    ],
    "stateMutability": "view",
    "type": "function"
  }
];

// Contract address from environment variables
const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS;

function App() {
  const [darkMode, setDarkMode] = useState(false);
  const [walletConnected, setWalletConnected] = useState(false);
  const [userAccount, setUserAccount] = useState('');
  const [provider, setProvider] = useState(null);
  const [contract, setContract] = useState(null);
  const fileInputRef = useRef(null);
  const verifyInputRef = useRef(null);
  
  // Sign document states
  const [currentFile, setCurrentFile] = useState(null);
  const [currentFileName, setCurrentFileName] = useState('');
  const [signLoading, setSignLoading] = useState(false);
  const [signResult, setSignResult] = useState(null);
  
  // Verify document states
  const [verifyFile, setVerifyFile] = useState(null);
  const [documentHash, setDocumentHash] = useState('');
  const [signerAddress, setSignerAddress] = useState('');
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [verifyResult, setVerifyResult] = useState(null);
  
  // History states
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyData, setHistoryData] = useState([]);

  // Load theme preference on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      setDarkMode(true);
      document.body.classList.add('dark');
    }
  }, []);

  // Initialize contract
  useEffect(() => {
    const initializeContract = async () => {
      try {
        // Check if MetaMask is available
        if (typeof window.ethereum !== 'undefined') {
          // Create provider without connecting
          const web3Provider = new ethers.BrowserProvider(window.ethereum);
          setProvider(web3Provider);
          
          if (CONTRACT_ADDRESS) {
            const contractInstance = new ethers.Contract(CONTRACT_ADDRESS, contractABI, web3Provider);
            setContract(contractInstance);
          }
        } else {
          console.warn('No Ethereum wallet detected');
        }
      } catch (error) {
        console.error('Contract initialization error:', error);
      }
    };
    
    initializeContract();
  }, []);

  // Toggle theme
  // Helper function to format timestamp in UTC
  const formatUTCTimestamp = (timestampSeconds) => {
    const date = new Date(Number(timestampSeconds) * 1000);
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const day = String(date.getUTCDate()).padStart(2, '0');
    const hours = String(date.getUTCHours()).padStart(2, '0');
    const minutes = String(date.getUTCMinutes()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes} UTC`;
  };

  const toggleTheme = () => {
    setDarkMode(!darkMode);
    document.body.classList.toggle('dark');
    localStorage.setItem('theme', !darkMode ? 'dark' : 'light');
  };

  // Disconnect wallet (clear local state)
  const disconnectWallet = () => {
    try {
      setUserAccount('');
      setWalletConnected(false);
      setProvider(null);
      setContract(null);
      // Note: MetaMask doesn't provide a programmatic disconnect; clearing local state is sufficient
    } catch (error) {
      console.error('Error disconnecting wallet:', error);
    }
  };

  // Connect wallet
  const connectWallet = async () => {
    try {
      if (!window.ethereum) {
        alert('Please install MetaMask!');
        return;
      }

      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      setUserAccount(accounts[0]);
      setWalletConnected(true);

      // Check network configuration
      const chainId = await window.ethereum.request({ method: 'eth_chainId' });
      const targetChainId = import.meta.env.VITE_CHAIN_ID;
      const targetChainName = import.meta.env.VITE_CHAIN_NAME;
      const targetRpcUrl = import.meta.env.VITE_RPC_URL;
      const targetExplorerUrl = import.meta.env.VITE_EXPLORER_URL;
      
      // Validate required environment variables
      if (!targetChainId || !targetChainName || !targetRpcUrl) {
        console.warn('Network configuration incomplete. Some features may not work properly.');
        return;
      }
      
      if (chainId !== targetChainId) {
        try {
          await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: targetChainId }],
          });
        } catch (switchError) {
          if (switchError.code === 4902) {
            await window.ethereum.request({
              method: 'wallet_addEthereumChain',
              params: [{
                chainId: targetChainId,
                chainName: targetChainName,
                rpcUrls: [targetRpcUrl],
                nativeCurrency: {
                  name: 'Hoodi Ether',
                  symbol: 'ETH',
                  decimals: 18
                },
                blockExplorerUrls: [targetExplorerUrl]
              }]
            });
          }
        }
      }
    } catch (error) {
      console.error('Error connecting wallet:', error);
      alert('Failed to connect wallet: ' + error.message);
    }
  };

  const loadSigningFile = (file) => {
    setCurrentFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      setCurrentFile(event.target.result);
    };
    reader.readAsText(file);
  };

  const loadVerifyFile = (file) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      setVerifyFile(event.target.result);
      const hash = ethers.keccak256(ethers.toUtf8Bytes(event.target.result));
      setDocumentHash(hash);
    };
    reader.readAsText(file);
  };

  // Handle file upload for signing
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      loadSigningFile(file);
    }
  };

  const handleSignDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const file = e.dataTransfer?.files?.[0];
    if (file) {
      loadSigningFile(file);
    }
  };

  // Handle file upload for verification
  const handleVerifyFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      loadVerifyFile(file);
    }
  };

  const handleVerifyDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const file = e.dataTransfer?.files?.[0];
    if (file) {
      loadVerifyFile(file);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  // Sign document
  const signDocument = async () => {
    if (!userAccount) {
      alert('Please connect your wallet first');
      return;
    }

    if (!contract) {
      alert(
        !CONTRACT_ADDRESS
          ? 'Smart contract address is not configured. Please set VITE_CONTRACT_ADDRESS in your environment variables.'
          : 'Contract not initialized. Please reload the dApp and try again.'
      );
      return;
    }

    if (!currentFile) {
      alert('Please upload a file to sign');
      return;
    }

    try {
      setSignLoading(true);
      setSignResult(null);

      const signer = await provider.getSigner();
      const contractWithSigner = contract.connect(signer);

      const docHash = ethers.keccak256(ethers.toUtf8Bytes(currentFile));
      const documentTitle = currentFileName || `Document_${Date.now()}`;
      
      // Get current nonce for the signer
      const nonce = await contract.getSignerNonce(userAccount);
      
      // Create the message hash that needs to be signed (same as contract)
      const messageToSign = ethers.solidityPackedKeccak256(
        ['bytes32', 'string', 'uint256', 'address'],
        [docHash, documentTitle, nonce, CONTRACT_ADDRESS]
      );
      
      // Create signature of the message hash
      const signature = await signer.signMessage(ethers.getBytes(messageToSign));

      const tx = await contractWithSigner.signDocument(docHash, documentTitle, signature, nonce);
      const receipt = await tx.wait();

      setSignResult({
        success: true,
        fileName: documentTitle,
        hash: docHash,
        signature: signature,
        signer: userAccount,
        txHash: receipt.hash,
        blockNumber: receipt.blockNumber,
        nonce: nonce.toString()
      });

      // Clear file
      setCurrentFile(null);
      setCurrentFileName('');
    } catch (error) {
      console.error('Signing failed:', error);
      
      // Check if this is a DocumentAlreadySigned error
      if (error.data === '0x38a49dd9' || error.message.includes('DocumentAlreadySigned')) {
        try {
          // Get the existing document details
          const docHash = ethers.keccak256(ethers.toUtf8Bytes(currentFile));
          const existingDocument = await contract.verifyDocument(docHash);
          
          if (existingDocument.exists) {
            setSignResult({
              success: false,
              error: 'ALREADY_SIGNED',
              fileName: currentFileName || 'Document',
              hash: docHash,
              existingDocument: {
                documentTitle: existingDocument.documentTitle,
                signer: existingDocument.signer,
                timestamp: formatUTCTimestamp(existingDocument.timestamp),
                signature: existingDocument.signature,
                signatureValid: existingDocument.signatureValid
              }
            });
          } else {
            setSignResult({
              success: false,
              error: 'ALREADY_SIGNED',
              message: 'This document has already been signed on the blockchain.'
            });
          }
        } catch (verifyError) {
          console.error('Failed to get existing document details:', verifyError);
          setSignResult({
            success: false,
            error: 'ALREADY_SIGNED',
            message: 'This document has already been signed on the blockchain, but could not retrieve details.'
          });
        }
      } else {
        // Other errors
        setSignResult({
          success: false,
          error: 'SIGNING_FAILED',
          message: error.message
        });
      }
    } finally {
      setSignLoading(false);
    }
  };

  // Verify document
  const verifyDocument = async () => {
    // Re-initialize contract if not available
    if (!contract && CONTRACT_ADDRESS) {
      try {
        if (typeof window.ethereum !== 'undefined') {
          const web3Provider = new ethers.BrowserProvider(window.ethereum);
          const contractInstance = new ethers.Contract(CONTRACT_ADDRESS, contractABI, web3Provider);
          setContract(contractInstance);
          setProvider(web3Provider);
        }
      } catch (initError) {
        console.error('Contract re-initialization failed:', initError);
      }
    }

    if (!contract) {
      alert(
        !CONTRACT_ADDRESS
          ? 'Smart contract address is not configured. Please set VITE_CONTRACT_ADDRESS in your environment variables.'
          : 'Contract initialization failed. Please check your network connection and try again.'
      );
      return;
    }

    let hashToVerify = documentHash;
    if (!hashToVerify && verifyFile) {
      hashToVerify = ethers.keccak256(ethers.toUtf8Bytes(verifyFile));
    }

    if (!hashToVerify) {
      alert('Please upload a file or enter a document hash');
      return;
    }

    // Validate document hash format
    try {
      // Remove 0x prefix if present for validation
      const cleanHash = hashToVerify.startsWith('0x') ? hashToVerify.slice(2) : hashToVerify;
      
      // Check if hash is exactly 64 hex characters
      if (cleanHash.length !== 64) {
        setVerifyResult({
          valid: false,
          signatureValid: false,
          error: true,
          errorMessage: `Invalid document hash format. Hash must be exactly 64 characters long.`
        });
        return;
      }
      
      // Check if hash contains only valid hex characters
      if (!/^[0-9a-fA-F]{64}$/.test(cleanHash)) {
        setVerifyResult({
          valid: false,
          signatureValid: false,
          error: true,
          errorMessage: 'Invalid document hash format. Hash must contain only hexadecimal characters (0-9, a-f, A-F).'
        });
        return;
      }
      
      // Ensure hash has 0x prefix
      hashToVerify = hashToVerify.startsWith('0x') ? hashToVerify : '0x' + hashToVerify;
      
    } catch (validateError) {
      setVerifyResult({
        valid: false,
        signatureValid: false,
        error: true,
        errorMessage: 'Invalid document hash format. Please check your input and try again.'
      });
      return;
    }

    try {
      setVerifyLoading(true);
      setVerifyResult(null);

      // Add timeout and better error handling
      const result = await Promise.race([
        contract.verifyDocument(hashToVerify),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Request timeout')), 30000)
        )
      ]);
      
      if (result.exists) {
        // Get the transaction hash for the signing event
        let signTransactionHash = null;
        try {
          console.log('Searching for DocumentSigned event...', {
            documentHash: hashToVerify,
            signer: result.signer
          });
          
          // Create event filter manually using the event signature
          const eventSignature = "DocumentSigned(bytes32,address,string,uint256,bytes,uint256)";
          const eventTopic = ethers.id(eventSignature);
          
          // Create filter for DocumentSigned events
          const filter = {
            address: CONTRACT_ADDRESS,
            topics: [
              eventTopic, // Event signature
              hashToVerify, // First indexed parameter (documentHash)
              ethers.zeroPadValue(result.signer, 32) // Second indexed parameter (signer)
            ],
            fromBlock: 0,
            toBlock: 'latest'
          };
          
          console.log('Event filter created:', filter);
          
          const logs = await provider.getLogs(filter);
          console.log('Raw logs found:', logs);
          
          if (logs.length > 0) {
            signTransactionHash = logs[0].transactionHash;
            console.log('Transaction hash found:', signTransactionHash);
          } else {
            console.warn('No events found for this document');
            
            // Try with just the document hash (in case signer encoding is wrong)
            const filterByHashOnly = {
              address: CONTRACT_ADDRESS,
              topics: [
                eventTopic, // Event signature
                hashToVerify // Only document hash
              ],
              fromBlock: 0,
              toBlock: 'latest'
            };
            
            const logsByHash = await provider.getLogs(filterByHashOnly);
            console.log('Logs found by hash only:', logsByHash);
            
            if (logsByHash.length > 0) {
              signTransactionHash = logsByHash[0].transactionHash;
              console.log('Transaction hash found by hash:', signTransactionHash);
            }
          }
        } catch (eventError) {
          console.error('Error fetching signing transaction:', eventError);
        }

        const timestamp = new Date(Number(result.timestamp) * 1000);
        setVerifyResult({
          valid: result.exists,
          signatureValid: result.signatureValid, // New cryptographic validation
          documentTitle: result.documentTitle,
          signer: result.signer,
          timestamp: formatUTCTimestamp(result.timestamp),
          signature: result.signature,
          hash: hashToVerify,
          signTransactionHash: signTransactionHash,
          matchesSigner: !signerAddress || result.signer.toLowerCase() === signerAddress.toLowerCase()
        });
      } else {
        setVerifyResult({
          valid: false,
          signatureValid: false
        });
      }
    } catch (error) {
      console.error('Verification failed:', error);
      
      let errorMessage = 'Document verification failed';
      
      if (error.message.includes('could not decode result data')) {
        errorMessage = 'Network error: Unable to decode contract response. Please check your network connection and try again.';
      } else if (error.message.includes('timeout')) {
        errorMessage = 'Request timeout: Please check your network connection and try again.';
      } else if (error.code === 'NETWORK_ERROR') {
        errorMessage = 'Network error: Please check your internet connection and try again.';
      } else if (error.code === 'INVALID_ARGUMENT' && error.message.includes('invalid BytesLike value')) {
        errorMessage = 'Invalid document hash format. Please provide a valid 32-byte hexadecimal hash (64 characters).';
      } else {
        errorMessage += ': ' + error.message;
      }
      
      setVerifyResult({
        valid: false,
        signatureValid: false,
        error: true,
        errorMessage: errorMessage
      });
    } finally {
      setVerifyLoading(false);
    }
  };

  // Get document history
  const getDocumentHistory = async () => {
    if (!userAccount) {
      alert('Please connect your wallet first');
      return;
    }

    if (!contract) {
      alert(
        !CONTRACT_ADDRESS
          ? 'Smart contract address is not configured. Please set VITE_CONTRACT_ADDRESS in your environment variables.'
          : 'Contract not initialized. Please reload the dApp and try again.'
      );
      return;
    }

    try {
      setHistoryLoading(true);
      const documentHashes = await contract.getDocumentsBySigner(userAccount);
      
      const historyPromises = documentHashes.map(async (hash) => {
        const details = await contract.verifyDocument(hash);
        return {
          hash,
          title: details.documentTitle,
          timestamp: formatUTCTimestamp(details.timestamp),
          signature: details.signature
        };
      });

      const history = await Promise.all(historyPromises);
      setHistoryData(history);
    } catch (error) {
      console.error('History loading failed:', error);
      alert('Failed to load document history: ' + error.message);
    } finally {
      setHistoryLoading(false);
    }
  };

  // Listen to account changes and prevent phantom wallet interference
  useEffect(() => {
    if (window.ethereum) {
      // Check if this is MetaMask specifically to avoid phantom wallet interference
      const isMetaMask = window.ethereum.isMetaMask;
      
      if (isMetaMask) {
        window.ethereum.on('accountsChanged', (accounts) => {
          setUserAccount(accounts[0]);
          setWalletConnected(!!accounts[0]);
        });

        window.ethereum.on('chainChanged', () => {
          window.location.reload();
        });
      }
    }
    
    // Cleanup function
    return () => {
      if (window.ethereum && window.ethereum.isMetaMask) {
        window.ethereum.removeAllListeners('accountsChanged');
        window.ethereum.removeAllListeners('chainChanged');
      }
    };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#B3EBF2] via-[#C9FDF2] to-[#B6F2D1] dark:from-gray-900 dark:to-gray-800 p-5 transition-colors duration-300">
      <div className="max-w-4xl mx-auto bg-white/80 dark:bg-gray-800/95 rounded-3xl shadow-2xl p-8 backdrop-blur-sm transition-all duration-300 border border-white/30 dark:border-gray-700">
        
        {/* Header */}
        <div className="text-center mb-8 relative">
          <button
            onClick={toggleTheme}
            className="absolute top-0 right-0 w-12 h-12 bg-[#B3EBF2] dark:bg-gray-700 rounded-full flex items-center justify-center cursor-pointer hover:scale-110 hover:rotate-12 transition-all duration-300 shadow-lg border-2 border-[#85D1DB]/60 dark:border-gray-600"
          >
            <span className="text-2xl">{darkMode ? '🌙' : '☀️'}</span>
          </button>
          
          <div className="flex justify-center items-center">
            <img src="/logo.svg" alt="MetaSign Logo" className="h-16 w-16 mr-4"/>
            <h1 className="text-5xl md:text-6xl title-font font-extrabold bg-gradient-to-l from-[#4edbed] via-[#87ecb4] to-[#92e6d4] bg-clip-text text-transparent">
              MetaSign
            </h1>
          </div>
          <p className="text-[#1F4850] dark:text-gray-400 text-lg">
            <>
              <span className="block text-2xl">Sign Once, Trust Forever</span>
              <span className="block text-base mt-2">Create immutable, verifiable proof of your documents, powered by Ethereum standards.</span>
            </>
          </p>
        </div>

        {/* Wallet Status */}
        <div className={`p-4 rounded-xl mb-6 text-center font-bold transition-all duration-300 ${
          walletConnected 
            ? 'bg-gradient-to-r from-green-500 to-green-600 text-white' 
            : 'bg-gradient-to-r from-red-500 to-red-600 text-white'
        }`}>
          {walletConnected 
            ? `Connected: ${userAccount.substring(0, 6)}...${userAccount.substring(38)}`
            : 'Wallet not connected'
          }
        </div>

        {/* Contract Info */}
        <div className="bg-[#C9FDF2] dark:bg-blue-900/30 border border-[#85D1DB] dark:border-blue-800 rounded-xl p-4 mb-6 text-sm transition-colors duration-300">
          <strong className="text-[#2F7A87] dark:text-blue-300">Smart Contract:</strong>{' '}
          <span className="text-[#1F4850] dark:text-gray-300">
            {CONTRACT_ADDRESS || '⚠️ Not configured'}
          </span>
        </div>

        {/* Wallet Connection Section */}
        <div className="bg-[#E6FBFF] dark:bg-gray-700 rounded-2xl p-6 mb-6 shadow-lg border border-[#85D1DB]/50 dark:border-gray-600 transition-all duration-300">
          <h2 className="text-2xl font-bold mb-4 text-[#1F4850] dark:text-gray-100">⚡︎ Wallet Connection</h2>
          {walletConnected ? (
            <button
              onClick={disconnectWallet}
              className="bg-gradient-to-r from-red-500 to-red-700 text-white px-8 py-3 rounded-full font-bold hover:-translate-y-1 hover:shadow-xl transition-all duration-300"
            >
              Disconnect Wallet
            </button>
          ) : (
            <button
              onClick={connectWallet}
              className="bg-gradient-to-r from-[#85D1DB] to-[#B6F2D1] text-[#0F2A30] px-8 py-3 rounded-full font-bold hover:-translate-y-1 hover:shadow-xl transition-all duration-300"
            >
              Connect Wallet
            </button>
          )}
        </div>

        {/* Sign Document Section */}
        <div className="bg-[#F0FFFB] dark:bg-gray-700 rounded-2xl p-6 mb-6 shadow-lg border border-[#B6F2D1]/60 dark:border-gray-600 transition-all duration-300">
          <h2 className="text-2xl font-bold mb-4 text-[#1F4850] dark:text-gray-100">𓂃🖊 Sign Document</h2>
          
          <div className="mb-4">
            <label className="block mb-2 font-bold text-[#2F7A87] dark:text-gray-300">Upload a file:</label>
            <div
              className="border-2 border-dashed border-[#85D1DB] dark:border-gray-600 rounded-xl p-8 text-center cursor-pointer hover:border-[#5FB6C6] hover:bg-[#B6F2D1]/40 dark:hover:bg-gray-600 transition-all duration-300 bg-[#E9FCFF] dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-[#5FB6C6]"
              onClick={() => fileInputRef.current?.click()}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  fileInputRef.current?.click();
                }
              }}
              role="button"
              tabIndex={0}
              onDragOver={handleDragOver}
              onDrop={handleSignDrop}
            >
              <input
                ref={fileInputRef}
                type="file"
                onChange={handleFileUpload}
                className="hidden"
                id="fileInput"
              />
              <div className="cursor-pointer text-[#1F4850] dark:text-gray-300">
                📄 Click to upload or drag and drop a file
              </div>
            </div>
            
            {currentFileName && (
              <div className="mt-3 bg-[#C9FDF2] dark:bg-green-900/30 border border-[#85D1DB]/50 dark:border-green-800 rounded-lg p-3 text-sm">
                <strong className="text-green-700 dark:text-green-300">✓ File loaded:</strong>{' '}
                <span className="text-black dark:text-green-100">{currentFileName}</span>
              </div>
            )}
          </div>

          <button
            onClick={signDocument}
            disabled={signLoading || !currentFile}
            className="bg-gradient-to-r from-[#85D1DB] to-[#B6F2D1] text-[#0F2A30] px-8 py-3 rounded-full font-bold hover:-translate-y-1 hover:shadow-xl transition-all duration-300 disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed disabled:transform-none"
          >
            {signLoading ? '⏳ Signing...' : 'Sign Document'}
          </button>

          {signResult && (
            <div className={`mt-6 p-6 rounded-xl shadow-lg ${
              signResult.success 
                ? 'bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-2 border-green-200 dark:border-green-800'
                : signResult.error === 'ALREADY_SIGNED'
                ? 'bg-gradient-to-r from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20 border-2 border-yellow-200 dark:border-yellow-800'
                : 'bg-gradient-to-r from-red-50 to-rose-50 dark:from-red-900/20 dark:to-rose-900/20 border-2 border-red-200 dark:border-red-800'
            }`}>
              {signResult.success ? (
                <>
                  <div className="flex items-center justify-center mb-4">
                    <h3 className="text-xl font-bold text-green-800 dark:text-green-300">
                      Document Signed Successfully!
                    </h3>
                  </div>
                  
                  <div className="bg-white/50 dark:bg-gray-800/30 rounded-lg p-4 space-y-3 text-sm">
                    <div className="grid grid-cols-1 gap-3">
                      
                      <div className="flex flex-col">
                        <span className="font-semibold text-green-700 dark:text-green-400 mb-1">Document:</span>
                        <span className="text-gray-700 dark:text-gray-300 pl-4">{signResult.fileName}</span>
                      </div>
                      
                      <div className="flex flex-col">
                        <span className="font-semibold text-green-700 dark:text-green-400 mb-1">Signer:</span>
                        <span className="text-gray-700 dark:text-gray-300 pl-4 font-mono text-xs">{signResult.signer}</span>
                      </div>
                      
                      <div className="flex flex-col">
                        <span className="font-semibold text-green-700 dark:text-green-400 mb-1">Transaction:</span>
                        <a
                          href={`${import.meta.env.VITE_EXPLORER_URL}/tx/${signResult.txHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 dark:text-blue-400 hover:underline pl-4 font-mono text-xs break-all"
                        >
                          {signResult.txHash}
                        </a>
                      </div>
                      
                      <div className="flex flex-col">
                        <span className="font-semibold text-green-700 dark:text-green-400 mb-1">Document Hash:</span>
                        <span className="text-gray-700 dark:text-gray-300 pl-4 font-mono text-xs break-all">{signResult.hash}</span>
                      </div>
                      
                      <div className="flex flex-col">
                        <span className="font-semibold text-green-700 dark:text-green-400 mb-1">Digital Signature:</span>
                        <span className="text-gray-700 dark:text-gray-300 pl-4 font-mono text-xs break-all">{signResult.signature}</span>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex flex-col">
                          <span className="font-semibold text-green-700 dark:text-green-400 mb-1">Block:</span>
                          <span className="text-gray-700 dark:text-gray-300 pl-4">{signResult.blockNumber}</span>
                        </div>
                      </div>
                      
                    </div>
                  </div>
                </>
              ) : signResult.error === 'ALREADY_SIGNED' ? (
                <>
                  <div className="flex items-center justify-center mb-4">
                    <h3 className="text-xl font-bold text-yellow-800 dark:text-yellow-300">
                      Document Already Signed!
                    </h3>
                  </div>
                  
                  <div className="bg-white/50 dark:bg-gray-800/30 rounded-lg p-4 space-y-4 text-sm">
                    <div className="flex items-center p-3 bg-yellow-100 dark:bg-yellow-900/30 border border-yellow-300 dark:border-yellow-800 rounded-lg">
                      <span className="text-yellow-800 dark:text-yellow-300 font-medium">
                        This document has already been signed on the blockchain and cannot be signed again.
                      </span>
                    </div>
                    
                    {signResult.existingDocument && (
                      <>
                        <div className="border-t border-gray-200 dark:border-gray-600 pt-4">
                          <h4 className="font-semibold text-yellow-700 dark:text-yellow-400 mb-3">Previous Signing Details:</h4>
                          
                          <div className="grid grid-cols-1 gap-3">
                            
                            <div className="flex flex-col">
                              <span className="font-semibold text-yellow-700 dark:text-yellow-400 mb-1">Document Title:</span>
                              <span className="text-gray-700 dark:text-gray-300 pl-4">{signResult.existingDocument.documentTitle}</span>
                            </div>
                            
                            <div className="flex flex-col">
                              <span className="font-semibold text-yellow-700 dark:text-yellow-400 mb-1">Signer:</span>
                              <span className="text-gray-700 dark:text-gray-300 pl-4 font-mono text-xs">{signResult.existingDocument.signer}</span>
                            </div>
                            
                            <div className="flex flex-col">
                              <span className="font-semibold text-yellow-700 dark:text-yellow-400 mb-1">Signed At:</span>
                              <span className="text-gray-700 dark:text-gray-300 pl-4">{signResult.existingDocument.timestamp}</span>
                            </div>
                            
                            <div className="flex flex-col">
                              <span className="font-semibold text-yellow-700 dark:text-yellow-400 mb-1">Signature Status:</span>
                              <span className={`pl-4 font-medium ${
                                signResult.existingDocument.signatureValid 
                                  ? 'text-green-600 dark:text-green-400' 
                                  : 'text-red-600 dark:text-red-400'
                              }`}>
                                {signResult.existingDocument.signatureValid ? '✅ Valid' : '❌ Invalid'}
                              </span>
                            </div>
                            
                            <div className="flex flex-col">
                              <span className="font-semibold text-yellow-700 dark:text-yellow-400 mb-1">Document Hash:</span>
                              <span className="text-gray-700 dark:text-gray-300 pl-4 font-mono text-xs break-all">{signResult.hash}</span>
                            </div>
                            
                            <div className="flex flex-col">
                              <span className="font-semibold text-yellow-700 dark:text-yellow-400 mb-1">Digital Signature:</span>
                              <span className="text-gray-700 dark:text-gray-300 pl-4 font-mono text-xs break-all">{signResult.existingDocument.signature}</span>
                            </div>
                            
                          </div>
                        </div>
                      </>
                    )}
                    
                    {signResult.message && !signResult.existingDocument && (
                      <div className="text-yellow-800 dark:text-yellow-300">
                        {signResult.message}
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center justify-center mb-4">
                    <span className="text-3xl mr-2">❌</span>
                    <h3 className="text-xl font-bold text-red-800 dark:text-red-300">
                      Document Signing Failed!
                    </h3>
                  </div>
                  
                  <div className="bg-white/50 dark:bg-gray-800/30 rounded-lg p-4 text-sm">
                    <div className="flex items-center p-3 bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-800 rounded-lg">
                      <span className="text-2xl mr-2">🚫</span>
                      <span className="text-red-800 dark:text-red-300 font-medium">
                        {signResult.message || 'An error occurred while signing the document.'}
                      </span>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Verify Document Section */}
        <div className="bg-[#F0FFFB] dark:bg-gray-700 rounded-2xl p-6 mb-6 shadow-lg border border-[#B6F2D1]/60 dark:border-gray-600 transition-all duration-300">
          <h2 className="text-2xl font-bold mb-4 text-[#1F4850] dark:text-gray-100">✔ Verify Document</h2>
          
          <div className="mb-4">
            <label className="block mb-2 font-bold text-[#2F7A87] dark:text-gray-300">Upload document to verify:</label>
            <div
              className="border-2 border-dashed border-[#85D1DB] dark:border-gray-600 rounded-xl p-8 text-center cursor-pointer hover:border-[#5FB6C6] hover:bg-[#B6F2D1]/40 dark:hover:bg-gray-600 transition-all duration-300 bg-[#E9FCFF] dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-[#5FB6C6]"
              onClick={() => verifyInputRef.current?.click()}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  verifyInputRef.current?.click();
                }
              }}
              role="button"
              tabIndex={0}
              onDragOver={handleDragOver}
              onDrop={handleVerifyDrop}
            >
              <input
                ref={verifyInputRef}
                type="file"
                onChange={handleVerifyFileUpload}
                className="hidden"
                id="verifyFileInput"
              />
              <div className="cursor-pointer text-[#1F4850] dark:text-gray-300">
                📄 Click to upload or drag and drop a file
              </div>
            </div>
          </div>

          <div className="mb-4">
            <label className="block mb-2 font-bold text-[#2F7A87] dark:text-gray-300">Or enter document hash:</label>
            <input
              type="text"
              value={documentHash}
              onChange={(e) => setDocumentHash(e.target.value)}
              placeholder="Enter document hash"
              className="w-full p-3 border-2 border-[#85D1DB] dark:border-gray-600 rounded-lg bg-white/90 dark:bg-gray-800 text-[#0F2A30] dark:text-gray-200 focus:border-[#5FB6C6] focus:outline-none transition-colors duration-300"
            />
          </div>

          <div className="mb-4">
            <label className="block mb-2 font-bold text-[#2F7A87] dark:text-gray-300">Signer Address (optional):</label>
            <input
              type="text"
              value={signerAddress}
              onChange={(e) => setSignerAddress(e.target.value)}
              placeholder="Enter signer's address to verify ownership"
              className="w-full p-3 border-2 border-[#85D1DB] dark:border-gray-600 rounded-lg bg-white/90 dark:bg-gray-800 text-[#0F2A30] dark:text-gray-200 focus:border-[#5FB6C6] focus:outline-none transition-colors duration-300"
            />
          </div>

          <button
            onClick={verifyDocument}
            disabled={verifyLoading}
            className="bg-gradient-to-r from-[#85D1DB] to-[#B6F2D1] text-[#0F2A30] px-8 py-3 rounded-full font-bold hover:-translate-y-1 hover:shadow-xl transition-all duration-300 disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed disabled:transform-none"
          >
            {verifyLoading ? '⏳ Verifying...' : 'Verify Document'}
          </button>

          {verifyResult && (
            <div className={`mt-6 p-6 rounded-xl shadow-lg ${
              verifyResult.error
                ? 'bg-gradient-to-r from-red-50 to-rose-50 dark:from-red-900/20 dark:to-rose-900/20 border-2 border-red-200 dark:border-red-800'
                : verifyResult.valid && verifyResult.signatureValid
                ? 'bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-2 border-green-200 dark:border-green-800'
                : verifyResult.valid && !verifyResult.signatureValid
                ? 'bg-gradient-to-r from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20 border-2 border-yellow-200 dark:border-yellow-800'
                : 'bg-gradient-to-r from-red-50 to-rose-50 dark:from-red-900/20 dark:to-rose-900/20 border-2 border-red-200 dark:border-red-800'
            }`}>
              {verifyResult.error ? (
                <>
                  <div className="flex items-center justify-center mb-4">
                    <span className="text-3xl mr-2">❌</span>
                    <h3 className="text-xl font-bold text-red-800 dark:text-red-300">
                      Invalid Document Hash
                    </h3>
                  </div>
                  
                  <div className="bg-white/50 dark:bg-gray-800/30 rounded-lg p-4 text-sm">
                    <div className="space-y-3">
                      <div className="flex flex-col">
                        <span className="font-semibold text-red-700 dark:text-red-400 mb-1">🚫 Error:</span>
                        <span className="text-gray-700 dark:text-gray-300 pl-4">{verifyResult.errorMessage}</span>
                      </div>
                      
                      <div className="flex flex-col">
                        <span className="font-semibold text-red-700 dark:text-red-400 mb-1">💡 Example Format:</span>
                        <span className="text-gray-600 dark:text-gray-400 pl-4 font-mono text-xs break-all">
                          0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef
                        </span>
                      </div>
                    </div>
                  </div>
                </>
              ) : verifyResult.valid ? (
                verifyResult.signatureValid ? (
                  <>
                    <div className="flex items-center justify-center mb-4">
                      <h3 className="text-xl font-bold text-green-800 dark:text-green-300">
                        Document is Valid & Cryptographically Secure
                      </h3>
                    </div>
                    
                    <div className="bg-white/50 dark:bg-gray-800/30 rounded-lg p-4 space-y-3 text-sm">
                      <div className="grid grid-cols-1 gap-3">
                        
                        <div className="flex flex-col">
                          <span className="font-semibold text-green-700 dark:text-green-400 mb-1">Document:</span>
                          <span className="text-gray-700 dark:text-gray-300 pl-4">{verifyResult.documentTitle}</span>
                        </div>
                        
                        <div className="flex flex-col">
                          <span className="font-semibold text-green-700 dark:text-green-400 mb-1">Signer:</span>
                          <span className="text-gray-700 dark:text-gray-300 pl-4 font-mono text-xs">{verifyResult.signer}</span>
                        </div>
                        
                        <div className="flex flex-col">
                          <span className="font-semibold text-green-700 dark:text-green-400 mb-1">Signed At:</span>
                          <span className="text-gray-700 dark:text-gray-300 pl-4">{verifyResult.timestamp}</span>
                        </div>
                        
                        <div className="flex flex-col">
                          <span className="font-semibold text-green-700 dark:text-green-400 mb-1">Signature Status:</span>
                          <span className="text-green-600 dark:text-green-400 pl-4 font-medium">✅ Cryptographically Valid</span>
                        </div>
                        
                        {verifyResult.signTransactionHash && (
                          <div className="flex flex-col">
                            <span className="font-semibold text-green-700 dark:text-green-400 mb-1">Sign Transaction:</span>
                            <a
                              href={`${import.meta.env.VITE_EXPLORER_URL || 'https://explorer.hoodi.io'}/tx/${verifyResult.signTransactionHash}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 dark:text-blue-400 hover:underline pl-4 font-mono text-xs break-all"
                            >
                              {verifyResult.signTransactionHash}
                            </a>
                          </div>
                        )}
                        
                        <div className="flex flex-col">
                          <span className="font-semibold text-green-700 dark:text-green-400 mb-1">Document Hash:</span>
                          <span className="text-gray-700 dark:text-gray-300 pl-4 font-mono text-xs break-all">{verifyResult.hash}</span>
                        </div>
                        
                        <div className="flex flex-col">
                          <span className="font-semibold text-green-700 dark:text-green-400 mb-1">Digital Signature:</span>
                          <span className="text-gray-700 dark:text-gray-300 pl-4 font-mono text-xs break-all">{verifyResult.signature}</span>
                        </div>
                        
                        {!verifyResult.matchesSigner && (
                          <div className="bg-yellow-100 dark:bg-yellow-900/30 border border-yellow-300 dark:border-yellow-800 rounded-lg p-3">
                            <div className="flex items-center">
                              <span className="text-red-600 dark:text-red-500 font-extrabold mr-2">Warning</span>
                              <span className="text-yellow-800 dark:text-yellow-300 font-medium">
                                Signer address does not match provided address
                              </span>
                            </div>
                          </div>
                        )}
                        
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-center justify-center mb-4">
                      <span className="text-3xl mr-2">⚠️</span>
                      <h3 className="text-xl font-bold text-yellow-800 dark:text-yellow-300">
                        Document Exists but Signature is Invalid
                      </h3>
                    </div>
                    
                    <div className="bg-white/50 dark:bg-gray-800/30 rounded-lg p-4 space-y-3 text-sm">
                      <div className="grid grid-cols-1 gap-3">
                        
                        <div className="flex flex-col">
                          <span className="font-semibold text-yellow-700 dark:text-yellow-400 mb-1">📄 Document:</span>
                          <span className="text-gray-700 dark:text-gray-300 pl-4">{verifyResult.documentTitle}</span>
                        </div>
                        
                        <div className="flex flex-col">
                          <span className="font-semibold text-yellow-700 dark:text-yellow-400 mb-1">👤 Signer:</span>
                          <span className="text-gray-700 dark:text-gray-300 pl-4 font-mono text-xs">{verifyResult.signer}</span>
                        </div>
                        
                        <div className="flex flex-col">
                          <span className="font-semibold text-yellow-700 dark:text-yellow-400 mb-1">⏰ Signed At:</span>
                          <span className="text-gray-700 dark:text-gray-300 pl-4">{verifyResult.timestamp}</span>
                        </div>
                        
                        <div className="flex flex-col">
                          <span className="font-semibold text-yellow-700 dark:text-yellow-400 mb-1">🔐 Signature Status:</span>
                          <span className="text-red-600 dark:text-red-400 pl-4 font-medium">❌ Cryptographically Invalid</span>
                        </div>
                        
                        {verifyResult.signTransactionHash && (
                          <div className="flex flex-col">
                            <span className="font-semibold text-yellow-700 dark:text-yellow-400 mb-1">🔗 Sign Transaction:</span>
                            <a
                              href={`${import.meta.env.VITE_EXPLORER_URL || 'https://explorer.hoodi.io'}/tx/${verifyResult.signTransactionHash}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 dark:text-blue-400 hover:underline pl-4 font-mono text-xs break-all"
                            >
                              {verifyResult.signTransactionHash}
                            </a>
                          </div>
                        )}
                        
                        <div className="flex flex-col">
                          <span className="font-semibold text-yellow-700 dark:text-yellow-400 mb-1">📋 Document Hash:</span>
                          <span className="text-gray-700 dark:text-gray-300 pl-4 font-mono text-xs break-all">{verifyResult.hash}</span>
                        </div>
                        
                        <div className="bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-800 rounded-lg p-3">
                          <div className="flex items-center">
                            <span className="text-2xl mr-2">🚨</span>
                            <span className="text-red-800 dark:text-red-300 font-medium">
                              WARNING: This document's signature cannot be verified. It may have been tampered with.
                            </span>
                          </div>
                        </div>
                        
                      </div>
                    </div>
                  </>
                )
              ) : (
                <>
                  <div className="flex items-center justify-center mb-4">
                    <span className="text-3xl mr-2">❌</span>
                    <h3 className="text-xl font-bold text-red-800 dark:text-red-300">
                      Document is Invalid or Not Found
                    </h3>
                  </div>
                  
                  <div className="bg-white/50 dark:bg-gray-800/30 rounded-lg p-4 text-center">
                    <span className="text-gray-700 dark:text-gray-300">
                      This document has not been signed on the blockchain.
                    </span>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Document History Section */}
        <div className="bg-[#F0FFFB] dark:bg-gray-700 rounded-2xl p-6 shadow-lg border border-[#B6F2D1]/60 dark:border-gray-600 transition-all duration-300">
          <h2 className="text-2xl font-bold mb-4 text-[#1F4850] dark:text-gray-100">🗒 Document History</h2>
          
          <button
            onClick={getDocumentHistory}
            disabled={historyLoading}
            className="bg-gradient-to-r from-[#85D1DB] to-[#B6F2D1] text-[#0F2A30] px-8 py-3 rounded-full font-bold hover:-translate-y-1 hover:shadow-xl transition-all duration-300 disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed disabled:transform-none"
          >
            {historyLoading ? '⏳ Loading...' : 'Load My Documents'}
          </button>

          {historyData.length > 0 && (
            <div className="mt-6 p-6 rounded-xl shadow-lg bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-2 border-blue-200 dark:border-blue-800">
              <div className="flex items-center justify-center mb-4">
                <h3 className="text-xl font-bold text-blue-800 dark:text-blue-300">
                  Your Signed Documents ({historyData.length})
                </h3>
              </div>
              
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {historyData.map((doc, index) => (
                  <div key={index} className="bg-white/50 dark:bg-gray-800/30 rounded-lg p-4 border border-blue-200/50 dark:border-blue-700/50">
                    <div className="flex items-center mb-3">
                      <h4 className="font-semibold text-blue-700 dark:text-blue-400">
                        Document #{index + 1}
                      </h4>
                    </div>
                    
                    <div className="grid grid-cols-1 gap-3 text-sm">
                      
                      <div className="flex flex-col">
                        <span className="font-semibold text-blue-700 dark:text-blue-400 mb-1">Title:</span>
                        <span className="text-gray-700 dark:text-gray-300 pl-4">{doc.title}</span>
                      </div>
                      
                      <div className="flex flex-col">
                        <span className="font-semibold text-blue-700 dark:text-blue-400 mb-1">Signed At:</span>
                        <span className="text-gray-700 dark:text-gray-300 pl-4">{doc.timestamp}</span>
                      </div>
                      
                      <div className="flex flex-col">
                        <span className="font-semibold text-blue-700 dark:text-blue-400 mb-1">Document Hash:</span>
                        <span className="text-gray-700 dark:text-gray-300 pl-4 font-mono text-xs break-all">{doc.hash}</span>
                      </div>
                      
                      <div className="flex flex-col">
                        <span className="font-semibold text-blue-700 dark:text-blue-400 mb-1">Digital Signature:</span>
                        <span className="text-gray-700 dark:text-gray-300 pl-4 font-mono text-xs break-all">{doc.signature}</span>
                      </div>
                      
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {historyData.length === 0 && !historyLoading && (
            <div className="mt-4 text-[#2F7A87] dark:text-gray-400 text-center">
              No documents found. Click "Load My Documents" to check your history.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;