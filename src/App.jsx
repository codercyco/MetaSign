import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import './App.css';

// Smart contract ABI
const contractABI = [
  {
    "inputs": [
      {"internalType": "bytes32", "name": "documentHash", "type": "bytes32"},
      {"internalType": "string", "name": "ipfsHash", "type": "string"},
      {"internalType": "string", "name": "documentTitle", "type": "string"}
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
      {"internalType": "string", "name": "ipfsHash", "type": "string"},
      {"internalType": "string", "name": "documentTitle", "type": "string"}
    ],
    "stateMutability": "view",
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
  }
];

// ⚠️ IMPORTANT: Replace this with your deployed contract address
const CONTRACT_ADDRESS = "0xYourContractAddressHere";

function App() {
  const [darkMode, setDarkMode] = useState(false);
  const [walletConnected, setWalletConnected] = useState(false);
  const [userAccount, setUserAccount] = useState('');
  const [provider, setProvider] = useState(null);
  const [contract, setContract] = useState(null);
  
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
    if (typeof window.ethereum !== 'undefined') {
      const web3Provider = new ethers.BrowserProvider(window.ethereum);
      setProvider(web3Provider);
      
      if (CONTRACT_ADDRESS !== "0xYourContractAddressHere") {
        const contractInstance = new ethers.Contract(CONTRACT_ADDRESS, contractABI, web3Provider);
        setContract(contractInstance);
      }
    }
  }, []);

  // Toggle theme
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

      // Check network
      const chainId = await window.ethereum.request({ method: 'eth_chainId' });
      if (chainId !== '0x4268') {
        try {
          await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: '0x4268' }],
          });
        } catch (switchError) {
          if (switchError.code === 4902) {
            await window.ethereum.request({
              method: 'wallet_addEthereumChain',
              params: [{
                chainId: '0x4268',
                chainName: 'Holesky',
                rpcUrls: ['https://ethereum-holesky.publicnode.com'],
                nativeCurrency: {
                  name: 'Holesky Ether',
                  symbol: 'ETH',
                  decimals: 18
                },
                blockExplorerUrls: ['https://holesky.etherscan.io']
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

  // Handle file upload for signing
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setCurrentFileName(file.name);
      const reader = new FileReader();
      reader.onload = (event) => {
        setCurrentFile(event.target.result);
      };
      reader.readAsText(file);
    }
  };

  // Handle file upload for verification
  const handleVerifyFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setVerifyFile(event.target.result);
        const hash = ethers.keccak256(ethers.toUtf8Bytes(event.target.result));
        setDocumentHash(hash);
      };
      reader.readAsText(file);
    }
  };

  // Sign document
  const signDocument = async () => {
    if (!contract || !userAccount) {
      alert('Please connect your wallet first');
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
      const ipfsHash = `ipfs_${docHash.substring(2, 10)}`;
      const documentTitle = currentFileName || `Document_${Date.now()}`;

      const tx = await contractWithSigner.signDocument(docHash, ipfsHash, documentTitle);
      const receipt = await tx.wait();

      setSignResult({
        success: true,
        fileName: documentTitle,
        hash: docHash,
        signer: userAccount,
        txHash: receipt.hash,
        blockNumber: receipt.blockNumber
      });

      // Clear file
      setCurrentFile(null);
      setCurrentFileName('');
    } catch (error) {
      console.error('Signing failed:', error);
      alert('Document signing failed: ' + error.message);
    } finally {
      setSignLoading(false);
    }
  };

  // Verify document
  const verifyDocument = async () => {
    if (!contract) {
      alert('Contract not initialized');
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

    try {
      setVerifyLoading(true);
      setVerifyResult(null);

      const result = await contract.verifyDocument(hashToVerify);
      
      if (result.exists) {
        const timestamp = new Date(Number(result.timestamp) * 1000);
        setVerifyResult({
          valid: true,
          documentTitle: result.documentTitle,
          signer: result.signer,
          timestamp: timestamp.toLocaleString(),
          ipfsHash: result.ipfsHash,
          hash: hashToVerify,
          matchesSigner: !signerAddress || result.signer.toLowerCase() === signerAddress.toLowerCase()
        });
      } else {
        setVerifyResult({
          valid: false
        });
      }
    } catch (error) {
      console.error('Verification failed:', error);
      alert('Document verification failed: ' + error.message);
    } finally {
      setVerifyLoading(false);
    }
  };

  // Get document history
  const getDocumentHistory = async () => {
    if (!contract || !userAccount) {
      alert('Please connect wallet first');
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
          timestamp: new Date(Number(details.timestamp) * 1000).toLocaleString(),
          ipfsHash: details.ipfsHash
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

  // Listen to account changes
  useEffect(() => {
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', (accounts) => {
        setUserAccount(accounts[0]);
        setWalletConnected(!!accounts[0]);
      });

      window.ethereum.on('chainChanged', () => {
        window.location.reload();
      });
    }
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 to-purple-900 dark:from-gray-900 dark:to-gray-800 p-5 transition-colors duration-300">
      <div className="max-w-4xl mx-auto bg-white/95 dark:bg-gray-800/95 rounded-3xl shadow-2xl p-8 backdrop-blur-sm transition-all duration-300">
        
        {/* Header */}
        <div className="text-center mb-8 relative">
          <button
            onClick={toggleTheme}
            className="absolute top-0 right-0 w-12 h-12 bg-white dark:bg-gray-700 rounded-full flex items-center justify-center cursor-pointer hover:scale-110 hover:rotate-12 transition-all duration-300 shadow-lg border-2 border-gray-200 dark:border-gray-600"
          >
            <span className="text-2xl">{darkMode ? '☀️' : '🌙'}</span>
          </button>
          
          <h1 className="text-5xl md:text-6xl title-font font-extrabold mb-3 bg-gradient-to-l from-purple-500 to-purple-900 bg-clip-text text-transparent">
            MetaSign
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-lg">
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
        <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-xl p-4 mb-6 text-sm transition-colors duration-300">
          <strong className="text-blue-700 dark:text-blue-300">Smart Contract:</strong>{' '}
          <span className="text-gray-700 dark:text-gray-300">
            {CONTRACT_ADDRESS !== "0xYourContractAddressHere" ? CONTRACT_ADDRESS : '⚠️ Not configured'}
          </span>
          <br />
          <strong className="text-blue-700 dark:text-blue-300">Network:</strong>{' '}
          <span className="text-gray-700 dark:text-gray-300">Ethereum Holesky Testnet (Chain ID: 17000)</span>
        </div>

        {/* Wallet Connection Section */}
        <div className="bg-white dark:bg-gray-700 rounded-2xl p-6 mb-6 shadow-lg border border-gray-200 dark:border-gray-600 transition-all duration-300">
          <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-gray-100">🔌 Wallet Connection</h2>
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
              className="bg-gradient-to-r from-purple-600 to-purple-800 text-white px-8 py-3 rounded-full font-bold hover:-translate-y-1 hover:shadow-xl transition-all duration-300"
            >
              Connect Wallet
            </button>
          )}
        </div>

        {/* Sign Document Section */}
        <div className="bg-white dark:bg-gray-700 rounded-2xl p-6 mb-6 shadow-lg border border-gray-200 dark:border-gray-600 transition-all duration-300">
          <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-gray-100">𓂃🖊 Sign Document</h2>
          
          <div className="mb-4">
            <label className="block mb-2 font-bold text-gray-600 dark:text-gray-300">Upload a file:</label>
            <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-8 text-center cursor-pointer hover:border-purple-500 hover:bg-purple-50 dark:hover:bg-gray-600 transition-all duration-300 bg-gray-50 dark:bg-gray-800">
              <input
                type="file"
                onChange={handleFileUpload}
                className="hidden"
                id="fileInput"
              />
              <label htmlFor="fileInput" className="cursor-pointer text-gray-700 dark:text-gray-300">
                📄 Click to upload or drag and drop a file
              </label>
            </div>
            
            {currentFileName && (
              <div className="mt-3 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-lg p-3 text-sm">
                <strong className="text-green-700 dark:text-green-300">✓ File loaded:</strong> {currentFileName}
              </div>
            )}
          </div>

          <button
            onClick={signDocument}
            disabled={signLoading || !currentFile}
            className="bg-gradient-to-r from-purple-600 to-purple-800 text-white px-8 py-3 rounded-full font-bold hover:-translate-y-1 hover:shadow-xl transition-all duration-300 disabled:bg-gray-400 disabled:cursor-not-allowed disabled:transform-none"
          >
            {signLoading ? '⏳ Signing...' : 'Sign Document'}
          </button>

          {signResult && (
            <div className="mt-4 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg p-4 text-sm font-mono break-all max-h-96 overflow-y-auto">
              <strong className="text-green-600">✅ Document signed successfully!</strong><br />
              <strong>File Name:</strong> {signResult.fileName}<br />
              <strong>Document Hash:</strong> {signResult.hash}<br />
              <strong>Signer:</strong> {signResult.signer}<br />
              <strong>Transaction:</strong>{' '}
              <a 
                href={`https://holesky.etherscan.io/tx/${signResult.txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 hover:underline"
              >
                {signResult.txHash}
              </a><br />
              <strong>Block:</strong> {signResult.blockNumber}
            </div>
          )}
        </div>

        {/* Verify Document Section */}
        <div className="bg-white dark:bg-gray-700 rounded-2xl p-6 mb-6 shadow-lg border border-gray-200 dark:border-gray-600 transition-all duration-300">
          <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-gray-100">✔ Verify Document</h2>
          
          <div className="mb-4">
            <label className="block mb-2 font-bold text-gray-600 dark:text-gray-300">Upload document to verify:</label>
            <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-8 text-center cursor-pointer hover:border-purple-500 hover:bg-purple-50 dark:hover:bg-gray-600 transition-all duration-300 bg-gray-50 dark:bg-gray-800">
              <input
                type="file"
                onChange={handleVerifyFileUpload}
                className="hidden"
                id="verifyFileInput"
              />
              <label htmlFor="verifyFileInput" className="cursor-pointer text-gray-700 dark:text-gray-300">
                📄 Click to upload or drag and drop a file
              </label>
            </div>
          </div>

          <div className="mb-4">
            <label className="block mb-2 font-bold text-gray-600 dark:text-gray-300">Or enter document hash:</label>
            <input
              type="text"
              value={documentHash}
              onChange={(e) => setDocumentHash(e.target.value)}
              placeholder="Enter document hash"
              className="w-full p-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 focus:border-purple-500 focus:outline-none transition-colors duration-300"
            />
          </div>

          <div className="mb-4">
            <label className="block mb-2 font-bold text-gray-600 dark:text-gray-300">Signer Address (optional):</label>
            <input
              type="text"
              value={signerAddress}
              onChange={(e) => setSignerAddress(e.target.value)}
              placeholder="Enter signer's address to verify ownership"
              className="w-full p-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 focus:border-purple-500 focus:outline-none transition-colors duration-300"
            />
          </div>

          <button
            onClick={verifyDocument}
            disabled={verifyLoading}
            className="bg-gradient-to-r from-purple-600 to-purple-800 text-white px-8 py-3 rounded-full font-bold hover:-translate-y-1 hover:shadow-xl transition-all duration-300 disabled:bg-gray-400 disabled:cursor-not-allowed disabled:transform-none"
          >
            {verifyLoading ? '⏳ Verifying...' : 'Verify Document'}
          </button>

          {verifyResult && (
            <div className={`mt-4 p-4 rounded-lg text-center font-bold ${
              verifyResult.valid
                ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 border border-green-300 dark:border-green-800'
                : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 border border-red-300 dark:border-red-800'
            }`}>
              {verifyResult.valid ? (
                <>
                  ✅ Document is VALID<br />
                  <div className="text-left mt-2 text-sm">
                    <strong>Document Title:</strong> {verifyResult.documentTitle}<br />
                    <strong>Signer:</strong> {verifyResult.signer}<br />
                    <strong>Signed at:</strong> {verifyResult.timestamp}<br />
                    <strong>IPFS Hash:</strong> {verifyResult.ipfsHash}<br />
                    <strong>Document Hash:</strong> {verifyResult.hash}
                    {!verifyResult.matchesSigner && (
                      <div className="mt-2 text-yellow-700 dark:text-yellow-400">
                        ⚠️ WARNING: Signer address does not match provided address
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <>
                  ❌ Document is INVALID or NOT FOUND<br />
                  <span className="text-sm">This document has not been signed on the blockchain.</span>
                </>
              )}
            </div>
          )}
        </div>

        {/* Document History Section */}
        <div className="bg-white dark:bg-gray-700 rounded-2xl p-6 shadow-lg border border-gray-200 dark:border-gray-600 transition-all duration-300">
          <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-gray-100">🗒 Document History</h2>
          
          <button
            onClick={getDocumentHistory}
            disabled={historyLoading}
            className="bg-gradient-to-r from-blue-500 to-blue-700 text-white px-8 py-3 rounded-full font-bold hover:-translate-y-1 hover:shadow-xl transition-all duration-300 disabled:bg-gray-400 disabled:cursor-not-allowed disabled:transform-none"
          >
            {historyLoading ? '⏳ Loading...' : 'Load My Documents'}
          </button>

          {historyData.length > 0 && (
            <div className="mt-4 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg p-4 text-sm max-h-96 overflow-y-auto">
              <strong className="text-gray-800 dark:text-gray-200">Your signed documents ({historyData.length}):</strong>
              <div className="mt-3 space-y-3">
                {historyData.map((doc, index) => (
                  <div key={index} className="bg-white dark:bg-gray-700 p-3 rounded-lg border border-gray-200 dark:border-gray-600">
                    <strong className="text-gray-800 dark:text-gray-200">Document {index + 1}:</strong><br />
                    <strong className="text-gray-600 dark:text-gray-400">Title:</strong> {doc.title}<br />
                    <strong className="text-gray-600 dark:text-gray-400">Hash:</strong> <span className="font-mono text-xs">{doc.hash}</span><br />
                    <strong className="text-gray-600 dark:text-gray-400">Signed:</strong> {doc.timestamp}<br />
                    <strong className="text-gray-600 dark:text-gray-400">IPFS:</strong> {doc.ipfsHash}
                  </div>
                ))}
              </div>
            </div>
          )}

          {historyData.length === 0 && !historyLoading && (
            <div className="mt-4 text-gray-600 dark:text-gray-400 text-center">
              No documents found. Click "Load My Documents" to check your history.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;