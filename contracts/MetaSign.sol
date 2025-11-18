// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

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
 * - Stores digital signature for non-repudiation
 * - Maintains per-signer document registry
 * - Provides immutable proof of existence and authorship
 */
contract MetaSign {
    
    // Structure to store document signing information
    struct DocumentRecord {
        bool exists;           // Flag indicating if document record exists
        address signer;        // Address of the account that signed the document
        uint256 timestamp;     // Block timestamp when document was signed
        string documentTitle;  // Human-readable title/name of the document
        bytes signature;       // Digital signature of the document hash
    }
    
    // Mapping from document hash to its signing record
    mapping(bytes32 => DocumentRecord) public documents;
    
    // Mapping from signer address to array of document hashes they've signed
    mapping(address => bytes32[]) public documentsBySigner;
    
    // Events for logging contract activities
    event DocumentSigned(
        bytes32 indexed documentHash,
        address indexed signer,
        string documentTitle,
        uint256 timestamp,
        bytes signature
    );
    
    event DocumentVerified(
        bytes32 indexed documentHash,
        address indexed verifier,
        bool exists
    );
    
    /**
     * @dev Sign a document by storing its hash, title, and digital signature
     * @param documentHash Keccak-256 hash of the document content
     * @param documentTitle Human-readable title or name for the document
     * @param signature Digital signature of the document hash (created off-chain)
     * 
     * Requirements:
     * - Document with this hash must not already exist
     * - Document title cannot be empty
     * - Signature cannot be empty
     */
    function signDocument(
        bytes32 documentHash,
        string calldata documentTitle,
        bytes calldata signature
    ) external {
        // Validate inputs
        require(documentHash != bytes32(0), "MetaSign: Document hash cannot be empty");
        require(bytes(documentTitle).length > 0, "MetaSign: Document title cannot be empty");
        require(signature.length > 0, "MetaSign: Signature cannot be empty");
        require(!documents[documentHash].exists, "MetaSign: Document already signed");
        
        // Create and store the document record
        documents[documentHash] = DocumentRecord({
            exists: true,
            signer: msg.sender,
            timestamp: block.timestamp,
            documentTitle: documentTitle,
            signature: signature
        });
        
        // Add to signer's document list
        documentsBySigner[msg.sender].push(documentHash);
        
        // Emit event for off-chain tracking
        emit DocumentSigned(
            documentHash,
            msg.sender,
            documentTitle,
            block.timestamp,
            signature
        );
    }
    
    /**
     * @dev Verify a document by retrieving its signing information
     * @param documentHash Keccak-256 hash of the document to verify
     * @return exists Whether the document record exists
     * @return signer Address that signed the document
     * @return timestamp When the document was signed
     * @return documentTitle Title of the document
     * @return signature Digital signature of the document hash
     */
    function verifyDocument(bytes32 documentHash)
        external
        view
        returns (
            bool exists,
            address signer,
            uint256 timestamp,
            string memory documentTitle,
            bytes memory signature
        )
    {
        DocumentRecord memory record = documents[documentHash];
        
        return (
            record.exists,
            record.signer,
            record.timestamp,
            record.documentTitle,
            record.signature
        );
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
     */
    function getDocumentInfo(bytes32 documentHash)
        external
        view
        returns (
            bool exists,
            address signer,
            uint256 timestamp,
            string memory documentTitle
        )
    {
        DocumentRecord memory record = documents[documentHash];
        
        return (
            record.exists,
            record.signer,
            record.timestamp,
            record.documentTitle
        );
    }
    
    /**
     * @dev Emergency function to verify contract deployment
     * @return Contract name and version
     */
    function getContractInfo()
        external
        pure
        returns (string memory name, string memory version)
    {
        return ("MetaSign", "1.0.0");
    }
}