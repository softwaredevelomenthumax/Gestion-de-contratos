const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

// Resolve correct MIME type from file extension
function getMimeType(fileName) {
  const ext = path.extname(fileName).toLowerCase();
  const mimeTypes = {
    '.pdf': 'application/pdf',
    '.doc': 'application/msword',
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  };
  return mimeTypes[ext] || 'application/octet-stream';
}

class GoogleDriveService {
  constructor() {
    this.drive = null;
    this.folderId = null;
    this.otrosiFolderId = null;
    this.contractFilesFolderId = null;
    this.initializeAuth();
  }

  initializeAuth() {
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );

    oauth2Client.setCredentials({
      refresh_token: process.env.GOOGLE_REFRESH_TOKEN
    });

    this.drive = google.drive({ version: 'v3', auth: oauth2Client });
  }

  async ensureFolderExists() {
    if (this.folderId) return this.folderId;

    try {
      // Search for existing folder
      const response = await this.drive.files.list({
        q: `name='${process.env.GOOGLE_DRIVE_FOLDER_NAME}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
        fields: 'files(id, name)'
      });

      if (response.data.files.length > 0) {
        this.folderId = response.data.files[0].id;
        console.log('Found existing folder:', this.folderId);
        return this.folderId;
      }

      // Create new folder if it doesn't exist
      const folderMetadata = {
        name: process.env.GOOGLE_DRIVE_FOLDER_NAME,
        mimeType: 'application/vnd.google-apps.folder'
      };

      const folder = await this.drive.files.create({
        resource: folderMetadata,
        fields: 'id'
      });

      this.folderId = folder.data.id;
      console.log('Created new folder:', this.folderId);
      return this.folderId;
    } catch (error) {
      console.error('Error ensuring folder exists:', error);
      throw error;
    }
  }

  async uploadFile(filePath, fileName, mimeType) {
    try {
      await this.ensureFolderExists();

      const fileMetadata = {
        name: fileName,
        parents: [this.folderId]
      };

      const media = {
        mimeType: mimeType,
        body: fs.createReadStream(filePath)
      };

      const response = await this.drive.files.create({
        resource: fileMetadata,
        media: media,
        fields: 'id,name,webViewLink,webContentLink'
      });

      console.log('File uploaded to Google Drive:', response.data.id);
      return {
        id: response.data.id,
        name: response.data.name,
        webViewLink: response.data.webViewLink,
        webContentLink: response.data.webContentLink
      };
    } catch (error) {
      console.error('Error uploading file to Google Drive:', error);
      throw error;
    }
  }

  async downloadFile(fileId, destinationPath) {
    try {
      const response = await this.drive.files.get({
        fileId: fileId,
        alt: 'media'
      }, {
        responseType: 'stream'
      });

      return new Promise((resolve, reject) => {
        const dest = fs.createWriteStream(destinationPath);
        response.data
          .on('end', () => resolve(destinationPath))
          .on('error', reject)
          .pipe(dest);
      });
    } catch (error) {
      console.error('Error downloading file from Google Drive:', error);
      throw error;
    }
  }

  async deleteFile(fileId) {
    try {
      await this.drive.files.update({
        fileId: fileId,
        requestBody: {
          trashed: true
        }
      });
      console.log('File moved to trash in Google Drive:', fileId);
    } catch (error) {
      console.error('Error deleting file from Google Drive:', error);
      throw error;
    }
  }

  async getFileStream(fileId) {
    try {
      const response = await this.drive.files.get({
        fileId: fileId,
        alt: 'media'
      }, {
        responseType: 'stream'
      });

      return response.data;
    } catch (error) {
      console.error('Error getting file stream from Google Drive:', error);
      throw error;
    }
  }

  async getFileMetadata(fileId) {
    try {
      const response = await this.drive.files.get({
        fileId: fileId,
        fields: 'id,name,mimeType,webViewLink,webContentLink,size,createdTime,modifiedTime'
      });

      return response.data;
    } catch (error) {
      console.error('Error getting file metadata from Google Drive:', error);
      throw error;
    }
  }

  // Otrosi-specific methods

  async ensureOtrosiFolderExists() {
    if (this.otrosiFolderId) return this.otrosiFolderId;

    try {
      // First ensure the main "Contract Management Files" folder exists
      const mainFolderId = await this.ensureFolderExists();

      // Search for existing "Otrosi Files" subfolder
      const response = await this.drive.files.list({
        q: `name='Otrosi Files' and mimeType='application/vnd.google-apps.folder' and '${mainFolderId}' in parents and trashed=false`,
        fields: 'files(id, name)'
      });

      if (response.data.files.length > 0) {
        this.otrosiFolderId = response.data.files[0].id;
        console.log('Found existing Otrosi Files folder:', this.otrosiFolderId);
        return this.otrosiFolderId;
      }

      // Create "Otrosi Files" subfolder if it doesn't exist
      const folderMetadata = {
        name: 'Otrosi Files',
        mimeType: 'application/vnd.google-apps.folder',
        parents: [mainFolderId]
      };

      const folder = await this.drive.files.create({
        resource: folderMetadata,
        fields: 'id'
      });

      this.otrosiFolderId = folder.data.id;
      console.log('Created new Otrosi Files folder:', this.otrosiFolderId);
      return this.otrosiFolderId;
    } catch (error) {
      console.error('Error ensuring Otrosi Files folder exists:', error);
      throw error;
    }
  }

  async uploadOtrosiFile(filePath, contractId, otrosiNumber, originalFileName) {
    const maxRetries = 3;
    let attempt = 0;

    while (attempt < maxRetries) {
      try {
        await this.ensureOtrosiFolderExists();

        // Create a descriptive filename with contract and otrosi information
        const timestamp = Date.now();
        const fileExtension = path.extname(originalFileName);
        const baseName = path.basename(originalFileName, fileExtension);
        const googleDriveFileName = `Contract_${contractId}_Otrosi_${otrosiNumber}_${timestamp}_${baseName}${fileExtension}`;

        const fileMetadata = {
          name: googleDriveFileName,
          parents: [this.otrosiFolderId]
        };

        const media = {
          mimeType: getMimeType(originalFileName),
          body: fs.createReadStream(filePath)
        };

        const response = await this.drive.files.create({
          resource: fileMetadata,
          media: media,
          fields: 'id,name,webViewLink,webContentLink,size'
        });

        console.log('Otrosi file uploaded to Google Drive:', {
          fileId: response.data.id,
          fileName: response.data.name,
          contractId,
          otrosiNumber
        });

        return {
          id: response.data.id,
          name: response.data.name,
          originalName: originalFileName,
          webViewLink: response.data.webViewLink,
          webContentLink: response.data.webContentLink,
          size: response.data.size
        };
      } catch (error) {
        attempt++;
        console.error(`Error uploading otrosi file (attempt ${attempt}/${maxRetries}):`, error);

        if (attempt >= maxRetries) {
          throw new Error(`Failed to upload otrosi file after ${maxRetries} attempts: ${error.message}`);
        }

        // Exponential backoff: wait 1s, 2s, 4s between retries
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt - 1) * 1000));
      }
    }
  }

  async uploadOtrosiFileFromBuffer(buffer, contractId, otrosiNumber, originalFileName) {
    const maxRetries = 3;
    let attempt = 0;

    while (attempt < maxRetries) {
      try {
        await this.ensureOtrosiFolderExists();

        // Create a descriptive filename with contract and otrosi information
        const timestamp = Date.now();
        const fileExtension = path.extname(originalFileName);
        const baseName = path.basename(originalFileName, fileExtension);
        const googleDriveFileName = `Contract_${contractId}_Otrosi_${otrosiNumber}_${timestamp}_${baseName}${fileExtension}`;

        const fileMetadata = {
          name: googleDriveFileName,
          parents: [this.otrosiFolderId]
        };

        // Upload directly from memory buffer - convert to stream for Google Drive API
        const { Readable } = require('stream');
        const bufferStream = Readable.from(buffer);

        const media = {
          mimeType: getMimeType(originalFileName),
          body: bufferStream
        };

        const response = await this.drive.files.create({
          resource: fileMetadata,
          media: media,
          fields: 'id,name,webViewLink,webContentLink,size'
        });

        console.log('Otrosi file uploaded to Google Drive from memory buffer:', {
          fileId: response.data.id,
          fileName: response.data.name,
          contractId,
          otrosiNumber,
          bufferSize: buffer.length
        });

        return {
          id: response.data.id,
          name: response.data.name,
          originalName: originalFileName,
          webViewLink: response.data.webViewLink,
          webContentLink: response.data.webContentLink,
          size: response.data.size || buffer.length
        };
      } catch (error) {
        attempt++;
        console.error(`Error uploading otrosi file from buffer (attempt ${attempt}/${maxRetries}):`, error);

        if (attempt >= maxRetries) {
          throw new Error(`Failed to upload otrosi file from buffer after ${maxRetries} attempts: ${error.message}`);
        }

        // Exponential backoff: wait 1s, 2s, 4s between retries
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt - 1) * 1000));
      }
    }
  }

  async getOtrosiFileStream(fileId) {
    const maxRetries = 3;
    let attempt = 0;

    while (attempt < maxRetries) {
      try {
        const response = await this.drive.files.get({
          fileId: fileId,
          alt: 'media'
        }, {
          responseType: 'stream'
        });

        console.log('Successfully retrieved otrosi file stream for fileId:', fileId);
        return response.data;
      } catch (error) {
        attempt++;
        console.error(`Error getting otrosi file stream (attempt ${attempt}/${maxRetries}):`, error);
        
        if (error.response?.status === 404) {
          throw new Error(`Otrosi file not found in Google Drive: ${fileId}`);
        }
        
        if (error.response?.status === 403) {
          throw new Error(`Access denied to otrosi file: ${fileId}`);
        }
        
        if (attempt >= maxRetries) {
          throw new Error(`Failed to get otrosi file stream after ${maxRetries} attempts: ${error.message}`);
        }
        
        // Exponential backoff for retries
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt - 1) * 1000));
      }
    }
  }

  async deleteOtrosiFile(fileId) {
    try {
      await this.drive.files.update({
        fileId: fileId,
        requestBody: {
          trashed: true
        }
      });
      console.log('Otrosi file moved to trash in Google Drive:', fileId);
      return true;
    } catch (error) {
      console.error('Error deleting otrosi file from Google Drive:', error);
      
      if (error.response?.status === 404) {
        console.warn('Otrosi file not found in Google Drive (may already be deleted):', fileId);
        return false;
      }
      
      throw error;
    }
  }

  // Contract Files specific methods

  async ensureContractFilesFolderExists() {
    if (this.contractFilesFolderId) return this.contractFilesFolderId;

    try {
      // First ensure the main "Contract Management Files" folder exists
      const mainFolderId = await this.ensureFolderExists();

      // Search for existing "Contract Files" subfolder
      const response = await this.drive.files.list({
        q: `name='Contract Files' and mimeType='application/vnd.google-apps.folder' and '${mainFolderId}' in parents and trashed=false`,
        fields: 'files(id, name)'
      });

      if (response.data.files.length > 0) {
        this.contractFilesFolderId = response.data.files[0].id;
        console.log('Found existing Contract Files folder:', this.contractFilesFolderId);
        return this.contractFilesFolderId;
      }

      // Create "Contract Files" subfolder if it doesn't exist
      console.log('Creating Contract Files subfolder in main folder:', mainFolderId);
      const folderMetadata = {
        name: 'Contract Files',
        mimeType: 'application/vnd.google-apps.folder',
        parents: [mainFolderId]
      };

      const folder = await this.drive.files.create({
        resource: folderMetadata,
        fields: 'id'
      });

      this.contractFilesFolderId = folder.data.id;
      console.log('Created new Contract Files folder:', this.contractFilesFolderId);
      console.log('Contract Files folder will be used as parent for uploads');
      return this.contractFilesFolderId;
    } catch (error) {
      console.error('Error ensuring Contract Files folder exists:', error);
      throw error;
    }
  }

  async uploadContractFile(filePath, contractId, originalFileName, fileCategory = 'contrato') {
    const maxRetries = 3;
    let attempt = 0;

    while (attempt < maxRetries) {
      try {
        await this.ensureContractFilesFolderExists();

        // Create a descriptive filename with contract information
        const timestamp = Date.now();
        const fileExtension = path.extname(originalFileName);
        const baseName = path.basename(originalFileName, fileExtension);
        const googleDriveFileName = `Contract_${contractId}_${fileCategory}_${timestamp}_${baseName}${fileExtension}`;

        console.log('Using Contract Files folder ID as parent:', this.contractFilesFolderId);
        const fileMetadata = {
          name: googleDriveFileName,
          parents: [this.contractFilesFolderId]
        };

        const media = {
          mimeType: getMimeType(originalFileName),
          body: fs.createReadStream(filePath)
        };

        const response = await this.drive.files.create({
          resource: fileMetadata,
          media: media,
          fields: 'id,name,webViewLink,webContentLink,size'
        });

        console.log('Contract file uploaded to Google Drive:', {
          fileId: response.data.id,
          fileName: response.data.name,
          contractId,
          category: fileCategory
        });

        return {
          id: response.data.id,
          name: response.data.name,
          originalName: originalFileName,
          webViewLink: response.data.webViewLink,
          webContentLink: response.data.webContentLink,
          size: response.data.size
        };
      } catch (error) {
        attempt++;
        console.error(`Error uploading contract file (attempt ${attempt}/${maxRetries}):`, error);

        if (attempt >= maxRetries) {
          throw new Error(`Failed to upload contract file after ${maxRetries} attempts: ${error.message}`);
        }

        // Exponential backoff: wait 1s, 2s, 4s between retries
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt - 1) * 1000));
      }
    }
  }

  async uploadContractFileFromBuffer(buffer, contractId, originalFileName, fileCategory = 'contrato') {
    const maxRetries = 3;
    let attempt = 0;

    while (attempt < maxRetries) {
      try {
        await this.ensureContractFilesFolderExists();

        // Create a descriptive filename with contract information
        const timestamp = Date.now();
        const fileExtension = path.extname(originalFileName);
        const baseName = path.basename(originalFileName, fileExtension);
        const googleDriveFileName = `Contract_${contractId}_${fileCategory}_${timestamp}_${baseName}${fileExtension}`;

        console.log('Using Contract Files folder ID as parent:', this.contractFilesFolderId);
        const fileMetadata = {
          name: googleDriveFileName,
          parents: [this.contractFilesFolderId]
        };

        // Upload directly from memory buffer - convert to stream for Google Drive API
        const { Readable } = require('stream');
        const bufferStream = Readable.from(buffer);

        const media = {
          mimeType: getMimeType(originalFileName),
          body: bufferStream
        };

        const response = await this.drive.files.create({
          resource: fileMetadata,
          media: media,
          fields: 'id,name,webViewLink,webContentLink,size'
        });

        console.log('Contract file uploaded to Google Drive from memory buffer:', {
          fileId: response.data.id,
          fileName: response.data.name,
          contractId,
          category: fileCategory,
          bufferSize: buffer.length
        });

        return {
          id: response.data.id,
          name: response.data.name,
          originalName: originalFileName,
          webViewLink: response.data.webViewLink,
          webContentLink: response.data.webContentLink,
          size: response.data.size || buffer.length
        };
      } catch (error) {
        attempt++;
        console.error(`Error uploading contract file from buffer (attempt ${attempt}/${maxRetries}):`, error);

        if (attempt >= maxRetries) {
          throw new Error(`Failed to upload contract file from buffer after ${maxRetries} attempts: ${error.message}`);
        }

        // Exponential backoff: wait 1s, 2s, 4s between retries
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt - 1) * 1000));
      }
    }
  }

  async getContractFileStream(fileId) {
    const maxRetries = 3;
    let attempt = 0;

    console.log('🔍 Getting contract file stream from Google Drive:', fileId);

    while (attempt < maxRetries) {
      try {
        console.log(`📥 Attempting to get file stream (attempt ${attempt + 1}/${maxRetries})`);
        
        const response = await this.drive.files.get({
          fileId: fileId,
          alt: 'media'
        }, {
          responseType: 'stream'
        });

        console.log('✅ Successfully retrieved contract file stream from Google Drive:', {
          fileId,
          statusCode: response.status,
          headers: response.headers
        });
        
        return response.data;
      } catch (error) {
        attempt++;
        console.error(`❌ Error getting contract file stream (attempt ${attempt}/${maxRetries}):`, {
          fileId,
          error: error.message,
          status: error.response?.status,
          statusText: error.response?.statusText
        });
        
        if (error.response?.status === 404) {
          throw new Error(`Contract file not found in Google Drive: ${fileId}`);
        }
        
        if (error.response?.status === 403) {
          throw new Error(`Access denied to contract file: ${fileId}`);
        }
        
        if (attempt >= maxRetries) {
          throw new Error(`Failed to get contract file stream after ${maxRetries} attempts: ${error.message}`);
        }
        
        // Exponential backoff for retries
        console.log(`⏳ Waiting ${Math.pow(2, attempt - 1)}s before retry...`);
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt - 1) * 1000));
      }
    }
  }

  async deleteContractFile(fileId) {
    try {
      await this.drive.files.update({
        fileId: fileId,
        requestBody: {
          trashed: true
        }
      });
      console.log('Contract file moved to trash in Google Drive:', fileId);
      return true;
    } catch (error) {
      console.error('Error deleting contract file from Google Drive:', error);
      
      if (error.response?.status === 404) {
        console.warn('Contract file not found in Google Drive (may already be deleted):', fileId);
        return false;
      }
      
      throw error;
    }
  }

  // Helper method to check if a string is a Google Drive file ID
  isGoogleDriveFileId(filepath) {
    // Google Drive file IDs are typically 25-44 characters long and contain only alphanumeric characters, hyphens, and underscores
    // They don't contain path separators
    return filepath && 
           typeof filepath === 'string' && 
           !filepath.includes('/') && 
           !filepath.includes('\\') && 
           filepath.length >= 25 && 
           filepath.length <= 44 &&
           /^[a-zA-Z0-9_-]+$/.test(filepath);
  }
}

module.exports = new GoogleDriveService();
