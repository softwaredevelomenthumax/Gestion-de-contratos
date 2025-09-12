const OtrosiFile = require('../models/OtrosiFile');
const { Contract } = require('../models/Contract');
const Otrosi = require('../models/Otrosi');
const googleDriveService = require('./googleDrive');

// Ensure associations are loaded
require('../models/associations');

class OtrosiFileService {
  /**
   * Validate if a user has access to an otrosi file
   * @param {number} otrosiFileId - The otrosi file ID
   * @param {number} userId - The user ID
   * @param {string} userRole - The user role ('regular' or 'lawyer')
   * @returns {Promise<{hasAccess: boolean, otrosiFile: Object|null, contract: Object|null}>}
   */
  async validateAccess(otrosiFileId, userId, userRole) {
    try {
      console.log('🔍 OtrosiFileService: Validating access for:', {
        otrosiFileId,
        userId,
        userRole
      });

      // Find the otrosi file with related contract information
      const otrosiFile = await OtrosiFile.findByPk(otrosiFileId, {
        include: [
          {
            model: Contract,
            as: 'contract',
            attributes: ['id', 'solicitanteId', 'estado']
          },
          {
            model: Otrosi,
            as: 'otrosi',
            attributes: ['id', 'numeroOtrosi', 'estado']
          }
        ]
      });

      console.log('📄 OtrosiFile found:', otrosiFile ? {
        id: otrosiFile.id,
        filename: otrosiFile.filename,
        filepath: otrosiFile.filepath,
        otrosiId: otrosiFile.otrosiId,
        hasContract: !!otrosiFile.contract,
        hasOtrosi: !!otrosiFile.otrosi
      } : 'null');

      if (!otrosiFile) {
        return {
          hasAccess: false,
          otrosiFile: null,
          contract: null,
          error: 'Otrosi file not found'
        };
      }

      // Lawyers can access all otrosi files
      if (userRole === 'lawyer') {
        return {
          hasAccess: true,
          otrosiFile,
          contract: otrosiFile.contract
        };
      }

      // Regular users can only access files from their own contracts
      if (userRole === 'regular' && otrosiFile.contract && otrosiFile.contract.solicitanteId === userId) {
        return {
          hasAccess: true,
          otrosiFile,
          contract: otrosiFile.contract
        };
      }

      return {
        hasAccess: false,
        otrosiFile: null,
        contract: null,
        error: 'Access denied: You can only access files from your own contracts'
      };
    } catch (error) {
      console.error('Error validating otrosi file access:', error);
      return {
        hasAccess: false,
        otrosiFile: null,
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
   * Download an otrosi file and return file stream and metadata
   * @param {number} otrosiFileId - The otrosi file ID
   * @param {number} userId - The user ID requesting the file
   * @param {string} userRole - The user role ('regular' or 'lawyer')
   * @returns {Promise<{success: boolean, stream?: Stream, filename?: string, error?: string}>}
   */
  async downloadFile(otrosiFileId, userId, userRole) {
    try {
      // Validate access first
      const accessResult = await this.validateAccess(otrosiFileId, userId, userRole);
      
      if (!accessResult.hasAccess) {
        return {
          success: false,
          error: accessResult.error || 'Access denied'
        };
      }

      const otrosiFile = accessResult.otrosiFile;
      
      // All files must be stored in Google Drive
      if (!this.isGoogleDriveFile(otrosiFile.filepath)) {
        console.error('Invalid file path - not a Google Drive file ID:', {
          fileId: otrosiFile.id,
          filename: otrosiFile.filename,
          filepath: otrosiFile.filepath,
          userId,
          userRole
        });
        return {
          success: false,
          error: 'File is not properly stored in Google Drive. Please re-upload the file.'
        };
      }

      // File is in Google Drive
      try {
        const stream = await googleDriveService.getOtrosiFileStream(otrosiFile.filepath);
        
        console.log('Successfully retrieved otrosi file from Google Drive:', {
          fileId: otrosiFile.filepath,
          filename: otrosiFile.filename,
          userId,
          userRole
        });

        return {
          success: true,
          stream,
          filename: otrosiFile.filename,
          mimetype: otrosiFile.mimetype || 'application/pdf',
          size: otrosiFile.size
        };
      } catch (driveError) {
        console.error('Error retrieving file from Google Drive:', driveError);
        return {
          success: false,
          error: 'File not found in Google Drive or access denied. Please re-upload the file.'
        };
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
   * Stream an otrosi file directly to an HTTP response
   * @param {number} otrosiFileId - The otrosi file ID
   * @param {Object} res - Express response object
   * @param {number} userId - The user ID requesting the file
   * @param {string} userRole - The user role ('regular' or 'lawyer')
   */
  async streamFile(otrosiFileId, res, userId, userRole) {
    try {
      const downloadResult = await this.downloadFile(otrosiFileId, userId, userRole);
      
      if (!downloadResult.success) {
        const statusCode = downloadResult.error.includes('not found') ? 404 :
                          downloadResult.error.includes('Access denied') ? 403 : 500;
        
        return res.status(statusCode).json({ 
          error: downloadResult.error 
        });
      }

      // Set appropriate headers for PDF viewing
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `inline; filename="${downloadResult.filename}"`);
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      
      if (downloadResult.size) {
        res.setHeader('Content-Length', downloadResult.size);
      }

      // Stream the file
      downloadResult.stream.pipe(res);
      
      // Handle stream errors
      downloadResult.stream.on('error', (error) => {
        console.error('Error streaming otrosi file:', error);
        if (!res.headersSent) {
          res.status(500).json({ error: 'Error streaming file' });
        }
      });

      // Log successful download
      downloadResult.stream.on('end', () => {
        console.log('Successfully streamed otrosi file:', {
          fileId: otrosiFileId,
          filename: downloadResult.filename,
          userId,
          userRole
        });
      });

    } catch (error) {
      console.error('Error in streamFile:', error);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  }

  /**
   * Get otrosi file metadata without downloading
   * @param {number} otrosiFileId - The otrosi file ID
   * @param {number} userId - The user ID requesting the metadata
   * @param {string} userRole - The user role ('regular' or 'lawyer')
   * @returns {Promise<{success: boolean, metadata?: Object, error?: string}>}
   */
  async getFileMetadata(otrosiFileId, userId, userRole) {
    try {
      const accessResult = await this.validateAccess(otrosiFileId, userId, userRole);
      
      if (!accessResult.hasAccess) {
        return {
          success: false,
          error: accessResult.error || 'Access denied'
        };
      }

      const otrosiFile = accessResult.otrosiFile;
      
      return {
        success: true,
        metadata: {
          id: otrosiFile.id,
          filename: otrosiFile.filename,
          mimetype: otrosiFile.mimetype,
          size: otrosiFile.size,
          category: otrosiFile.category,
          fileType: otrosiFile.fileType,
          responseType: otrosiFile.responseType,
          uploadedAt: otrosiFile.uploadedAt,
          isGoogleDriveFile: this.isGoogleDriveFile(otrosiFile.filepath),
          contractId: otrosiFile.contractId,
          otrosiId: otrosiFile.otrosiId
        }
      };
    } catch (error) {
      console.error('Error getting otrosi file metadata:', error);
      return {
        success: false,
        error: 'Internal server error'
      };
    }
  }
}

module.exports = new OtrosiFileService();