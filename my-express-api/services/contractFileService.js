const ContractFile = require('../models/ContractFile');
const { Contract } = require('../models/Contract');
const googleDriveService = require('./googleDrive');

// Ensure associations are loaded
require('../models/associations');

class ContractFileService {
  /**
   * Validate if a user has access to a contract file
   * @param {number} contractFileId - The contract file ID
   * @param {number} userId - The user ID
   * @param {string} userRole - The user role ('regular' or 'lawyer')
   * @returns {Promise<{hasAccess: boolean, contractFile: Object|null, contract: Object|null}>}
   */
  async validateAccess(contractFileId, userId, userRole) {
    try {
      console.log('🔍 Validating access for contract file:', {
        contractFileId,
        userId,
        userRole
      });

      // Find the contract file with related contract information
      const contractFile = await ContractFile.findByPk(contractFileId, {
        include: [
          {
            model: Contract,
            as: 'associatedContract',
            attributes: ['id', 'solicitanteId', 'estado']
          }
        ]
      });

      console.log('📄 Contract file found:', contractFile ? {
        id: contractFile.id,
        filename: contractFile.filename,
        filepath: contractFile.filepath,
        contractId: contractFile.contractId,
        hasAssociatedContract: !!contractFile.associatedContract
      } : 'null');

      if (!contractFile) {
        console.log('❌ Contract file not found in database');
        return {
          hasAccess: false,
          contractFile: null,
          contract: null,
          error: 'Contract file not found'
        };
      }

      // Lawyers can access all contract files
      if (userRole === 'lawyer') {
        return {
          hasAccess: true,
          contractFile,
          contract: contractFile.associatedContract
        };
      }

      // Regular users can only access files from their own contracts
      if (userRole === 'regular' && contractFile.associatedContract && contractFile.associatedContract.solicitanteId === userId) {
        return {
          hasAccess: true,
          contractFile,
          contract: contractFile.associatedContract
        };
      }

      return {
        hasAccess: false,
        contractFile: null,
        contract: null,
        error: 'Access denied: You can only access files from your own contracts'
      };
    } catch (error) {
      console.error('Error validating contract file access:', error);
      return {
        hasAccess: false,
        contractFile: null,
        contract: null,
        error: 'Internal server error during access validation'
      };
    }
  }

  /**
   * Check if a filepath is a Google Drive file ID or local path
   * @param {string} filepath - The filepath to check
   * @returns {boolean} - True if it's a Google Drive file ID
   */
  isGoogleDriveFile(filepath) {
    return googleDriveService.isGoogleDriveFileId(filepath);
  }

  /**
   * Download a contract file and return file stream and metadata
   * @param {number} contractFileId - The contract file ID
   * @param {number} userId - The user ID requesting the file
   * @param {string} userRole - The user role ('regular' or 'lawyer')
   * @returns {Promise<{success: boolean, stream?: Stream, filename?: string, error?: string}>}
   */
  async downloadFile(contractFileId, userId, userRole) {
    try {
      // Validate access first
      const accessResult = await this.validateAccess(contractFileId, userId, userRole);
      
      if (!accessResult.hasAccess) {
        return {
          success: false,
          error: accessResult.error || 'Access denied'
        };
      }

      const contractFile = accessResult.contractFile;
      
      // Check if file is stored in Google Drive or locally
      if (this.isGoogleDriveFile(contractFile.filepath)) {
        // File is in Google Drive
        try {
          const stream = await googleDriveService.getContractFileStream(contractFile.filepath);
          
          console.log('Successfully retrieved contract file from Google Drive:', {
            fileId: contractFile.filepath,
            filename: contractFile.filename,
            userId,
            userRole
          });

          return {
            success: true,
            stream,
            filename: contractFile.filename,
            mimetype: contractFile.mimetype || '.pdf .doc .docx',
            size: contractFile.size
          };
        } catch (driveError) {
          console.error('Error retrieving file from Google Drive:', driveError);
          return {
            success: false,
            error: 'File not found in Google Drive or access denied'
          };
        }
      } else {
        // File is stored locally (legacy files during migration)
        const fs = require('fs');
        const path = require('path');
        
        const localFilePath = path.resolve(contractFile.filepath);
        
        // Check if local file exists
        if (!fs.existsSync(localFilePath)) {
          console.error('Local contract file not found:', localFilePath);
          return {
            success: false,
            error: 'File not found on server'
          };
        }

        try {
          const stream = fs.createReadStream(localFilePath);
          
          console.log('Successfully retrieved contract file from local storage:', {
            filepath: localFilePath,
            filename: contractFile.filename,
            userId,
            userRole
          });

          return {
            success: true,
            stream,
            filename: contractFile.filename,
            mimetype: contractFile.mimetype || '.pdf .doc .docx',
            size: contractFile.size
          };
        } catch (fileError) {
          console.error('Error reading local file:', fileError);
          return {
            success: false,
            error: 'Error reading file from server'
          };
        }
      }
    } catch (error) {
      console.error('Error in downloadFile:', error);
      return {
        success: false,
        error: 'Internal server error'
      };
    }
  }

  /**
   * Stream a contract file directly to an HTTP response
   * @param {number} contractFileId - The contract file ID
   * @param {Object} res - Express response object
   * @param {number} userId - The user ID requesting the file
   * @param {string} userRole - The user role ('regular' or 'lawyer')
   */
  async streamFile(contractFileId, res, userId, userRole) {
    try {
      console.log('🔍 Starting file stream for contract file:', {
        contractFileId,
        userId,
        userRole
      });

      const downloadResult = await this.downloadFile(contractFileId, userId, userRole);
      
      if (!downloadResult.success) {
        console.error('❌ Download failed:', downloadResult.error);
        console.error('❌ Full download result:', downloadResult);
        const statusCode = downloadResult.error.includes('not found') ? 404 :
                          downloadResult.error.includes('Access denied') ? 403 : 500;
        
        console.log('❌ Sending error response with status:', statusCode);
        return res.status(statusCode).json({ 
          error: downloadResult.error 
        });
      }

      console.log('✅ Download successful, setting headers and streaming...');
      console.log('📄 File info:', {
        filename: downloadResult.filename,
        mimetype: downloadResult.mimetype,
        size: downloadResult.size
      });

      // Set appropriate headers for PDF viewing
      res.setHeader('Content-Type', '.pdf .doc .docx');
      res.setHeader('Content-Disposition', `inline; filename="${downloadResult.filename}"`);
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      res.setHeader('Accept-Ranges', 'bytes');
      
      if (downloadResult.size) {
        res.setHeader('Content-Length', downloadResult.size);
      }

      console.log('📤 Starting to pipe stream to response...');

      // Stream the file
      downloadResult.stream.pipe(res);
      
      // Handle stream errors
      downloadResult.stream.on('error', (error) => {
        console.error('❌ Error streaming contract file:', error);
        if (!res.headersSent) {
          res.status(500).json({ error: 'Error streaming file' });
        }
      });

      // Log successful download
      downloadResult.stream.on('end', () => {
        console.log('✅ Successfully streamed contract file:', {
          fileId: contractFileId,
          filename: downloadResult.filename,
          userId,
          userRole
        });
      });

      // Add close event handler
      downloadResult.stream.on('close', () => {
        console.log('🔒 Stream closed for contract file:', contractFileId);
      });

    } catch (error) {
      console.error('❌ Error in streamFile:', error);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  }

  /**
   * Get contract file metadata without downloading
   * @param {number} contractFileId - The contract file ID
   * @param {number} userId - The user ID requesting the metadata
   * @param {string} userRole - The user role ('regular' or 'lawyer')
   * @returns {Promise<{success: boolean, metadata?: Object, error?: string}>}
   */
  async getFileMetadata(contractFileId, userId, userRole) {
    try {
      const accessResult = await this.validateAccess(contractFileId, userId, userRole);
      
      if (!accessResult.hasAccess) {
        return {
          success: false,
          error: accessResult.error || 'Access denied'
        };
      }

      const contractFile = accessResult.contractFile;
      
      return {
        success: true,
        metadata: {
          id: contractFile.id,
          filename: contractFile.filename,
          mimetype: contractFile.mimetype,
          size: contractFile.size,
          category: contractFile.category,
          fileType: contractFile.fileType,
          responseType: contractFile.responseType,
          created_at: contractFile.created_at,
          isGoogleDriveFile: this.isGoogleDriveFile(contractFile.filepath),
          contractId: contractFile.contractId
        }
      };
    } catch (error) {
      console.error('Error getting contract file metadata:', error);
      return {
        success: false,
        error: 'Internal server error'
      };
    }
  }
}

module.exports = new ContractFileService();