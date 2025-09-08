const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

class GoogleDriveService {
  constructor() {
    this.drive = null;
    this.folderId = null;
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
}

module.exports = new GoogleDriveService();
