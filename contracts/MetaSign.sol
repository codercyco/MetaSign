// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

/**
 * @title MetaSign - Document Signing and Verification Contract
 * @dev A smart contract for cryptographic document signing and verification
 * @author MetaSign Team
 * 
 * This contract allows users to:
 * 1. Sign documents by storing their hash, title, and digital signature
 * 2. Verify document authenticity by checking stored records
 * 3. Retrieve signing history by signer address
 * 
 * Key Features:
 * - Stores document hash (Keccak-256) for content integrity
 * - Verifies digital signature cryptographically using ECDSA
 * - Maintains per-signer document registry
 * - Provides immutable proof of existence and authorship
 * - Prevents signature replay attacks with nonce system
 */
contract MetaSign {
    using ECDSA for bytes32;
    
    // Structure to store document signing information
    struct DocumentRecord {
        bool exists;           // Flag indicating if document record exists
        address signer;        // Address of the account that signed the document
        uint256 timestamp;     // Block timestamp when document was signed
        string documentTitle;  // Human-readable title/name of the document
        bytes signature;       // Digital signature of the document hash
        uint256 nonce;         // Unique nonce for replay protection
    }
    
    // Mapping from document hash to its signing record
    mapping(bytes32 => DocumentRecord) public documents;
    
    // Mapping from signer address to array of document hashes they've signed
    mapping(address => bytes32[]) public documentsBySigner;
    
    // Mapping from signer to their current nonce (prevents replay attacks)
    mapping(address => uint256) public signerNonces;
    
    // Events for logging contract activities
    event DocumentSigned(
        bytes32 indexed documentHash,
        address indexed signer,
        string documentTitle,
        uint256 timestamp,
        bytes signature,
        uint256 nonce
    );
    
    event DocumentVerified(
        bytes32 indexed documentHash,
        address indexed verifier,
        bool exists,
        bool signatureValid
    );
    
    // Custom errors for gas efficiency
    error EmptyDocumentHash();
    error EmptyDocumentTitle();
    error EmptySignature();
    error DocumentAlreadySigned();
    error InvalidSignature();
    error InvalidNonce();
    
    /**
     * @dev Sign a document by storing its hash, title, and digital signature
     * @param documentHash Keccak-256 hash of the document content
     * @param documentTitle Human-readable title or name for the document
     * @param signature Digital signature of the message hash (created off-chain)
     * @param nonce Unique nonce to prevent replay attacks
     * 
     * Requirements:
     * - Document with this hash must not already exist
     * - Document title cannot be empty
     * - Signature cannot be empty
     * - Signature must be valid and match the signer
     * - Nonce must match expected value for the signer
     */
    function signDocument(
        bytes32 documentHash,
        string calldata documentTitle,
        bytes calldata signature,
        uint256 nonce
    ) external {
        // Validate inputs
        if (documentHash == bytes32(0)) revert EmptyDocumentHash();
        if (bytes(documentTitle).length == 0) revert EmptyDocumentTitle();
        if (signature.length == 0) revert EmptySignature();
        if (documents[documentHash].exists) revert DocumentAlreadySigned();
        if (nonce != signerNonces[msg.sender]) revert InvalidNonce();
        
        // Create the message hash that should have been signed
        bytes32 messageHash = keccak256(abi.encodePacked(
            "\x19Ethereum Signed Message:\n32",
            keccak256(abi.encodePacked(documentHash, documentTitle, nonce, address(this)))
        ));
        
        // Verify the signature
        address recoveredSigner = messageHash.recover(signature);
        if (recoveredSigner != msg.sender) revert InvalidSignature();
        
        // Increment nonce to prevent replay attacks
        signerNonces[msg.sender]++;
        
        // Create and store the document record
        documents[documentHash] = DocumentRecord({
            exists: true,
            signer: msg.sender,
            timestamp: block.timestamp,
            documentTitle: documentTitle,
            signature: signature,
            nonce: nonce
        });
        
        // Add to signer's document list
        documentsBySigner[msg.sender].push(documentHash);
        
        // Emit event for off-chain tracking
        emit DocumentSigned(
            documentHash,
            msg.sender,
            documentTitle,
            block.timestamp,
            signature,
            nonce
        );
    }
    
    /**
     * @dev Verify a document by retrieving its signing information and validating signature
     * @param documentHash Keccak-256 hash of the document to verify
     * @return exists Whether the document record exists
     * @return signer Address that signed the document
     * @return timestamp When the document was signed
     * @return documentTitle Title of the document
     * @return signature Digital signature of the document hash
     * @return signatureValid Whether the stored signature is cryptographically valid
     */
    function verifyDocument(bytes32 documentHash)
        external
        returns (
            bool exists,
            address signer,
            uint256 timestamp,
            string memory documentTitle,
            bytes memory signature,
            bool signatureValid
        )
    {
        DocumentRecord memory record = documents[documentHash];
        
        bool sigValid = false;
        
        if (record.exists) {
            // Recreate the message hash that should have been signed
            bytes32 messageHash = keccak256(abi.encodePacked(
                "\x19Ethereum Signed Message:\n32",
                keccak256(abi.encodePacked(documentHash, record.documentTitle, record.nonce, address(this)))
            ));
            
            // Verify the signature
            address recoveredSigner = messageHash.recover(record.signature);
            sigValid = (recoveredSigner == record.signer);
        }
        
        // Emit verification event
        emit DocumentVerified(documentHash, msg.sender, record.exists, sigValid);
        
        return (
            record.exists,
            record.signer,
            record.timestamp,
            record.documentTitle,
            record.signature,
            sigValid
        );
    }
    
    /**
     * @dev Get the current nonce for a signer (needed for signature creation)
     * @param signer Address to query nonce for
     * @return Current nonce value
     */
    function getSignerNonce(address signer) external view returns (uint256) {
        return signerNonces[signer];
    }
    
    /**
     * @dev Get all document hashes signed by a specific address
     * @param signer Address to query for signed documents
     * @return Array of document hashes signed by the address
     */
    function getDocumentsBySigner(address signer)
        external
        view
        returns (bytes32[] memory)
    {
        return documentsBySigner[signer];
    }
    
    /**
     * @dev Get the total number of documents signed by an address
     * @param signer Address to query
     * @return Number of documents signed by the address
     */
    function getSignedDocumentCount(address signer)
        external
        view
        returns (uint256)
    {
        return documentsBySigner[signer].length;
    }
    
    /**
     * @dev Check if a specific document exists in the registry
     * @param documentHash Hash of the document to check
     * @return Whether the document exists
     */
    function documentExists(bytes32 documentHash)
        external
        view
        returns (bool)
    {
        return documents[documentHash].exists;
    }
    
    /**
     * @dev Get basic document information (without signature data)
     * @param documentHash Hash of the document
     * @return exists Whether the document exists
     * @return signer Address that signed the document
     * @return timestamp When it was signed
     * @return documentTitle Title of the document
     * @return nonce Nonce used for the signature
     */
    function getDocumentInfo(bytes32 documentHash)
        external
        view
        returns (
            bool exists,
            address signer,
            uint256 timestamp,
            string memory documentTitle,
            uint256 nonce
        )
    {
        DocumentRecord memory record = documents[documentHash];
        
        return (
            record.exists,
            record.signer,
            record.timestamp,
            record.documentTitle,
            record.nonce
        );
    }
    
    /**
     * @dev Emergency function to verify contract deployment
     * @return name Contract name
     * @return version Contract version
     */
    function getContractInfo()
        external
        pure
        returns (string memory name, string memory version)
    {
        return ("MetaSign", "1.0.0");
    }
}