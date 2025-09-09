const multer = require('multer');
const path = require('path');
const googleDriveService = require('../services/googleDrive');

// Use memory storage - no temporary files created! 🎉
const storage = multer.memoryStorage();

const upload = multer({
  storage: storage,
  limits: { fileSize: 30 * 1024 * 1024 },
  fileFilter: function (req, file, cb) {
    if (file.mimetype !== 'application/pdf') {
      return cb(new Error('Only PDF files are allowed'));
    }
    cb(null, true);
  }
});

// Create a specific upload middleware for otrosi that handles multiple files
const uploadOtrosi = multer({
  storage: storage,
  limits: { fileSize: 30 * 1024 * 1024 },
  fileFilter: function (req, file, cb) {
    if (file.mimetype !== 'application/pdf') {
      return cb(new Error('Only PDF files are allowed'));
    }
    cb(null, true);
  }
}).fields([
  { name: 'cartaSolicitud', maxCount: 1 },
  { name: 'firmarOtrosi', maxCount: 1 },
  { name: 'firmaAbogado', maxCount: 1 }
]);

// Enhanced otrosi upload middleware that uploads to Google Drive
const uploadOtrosiWithGoogleDrive = (req, res, next) => {
  // First, use the regular multer upload to handle file validation and temporary storage
  uploadOtrosi(req, res, async (err) => {
    if (err) {
      console.error('Multer upload error:', err);
      return res.status(400).json({ error: err.message });
    }

    // If no files were uploaded, continue to the next middleware
    if (!req.files || Object.keys(req.files).length === 0) {
      return next();
    }

    try {
      // Process each uploaded file and upload to Google Drive
      const uploadedFiles = {};
      const contractId = req.body.contractId || req.params.contractId || req.params.id;
      const otrosiNumber = req.body.numeroOtrosi || 1;

      for (const [fieldName, files] of Object.entries(req.files)) {
        if (files && files.length > 0) {
          const file = files[0]; // Each field should have only one file
          
          try {
            console.log(`Uploading ${fieldName} to Google Drive:`, {
              originalName: file.originalname,
              size: file.size,
              contractId,
              otrosiNumber
            });

            // Upload to Google Drive directly from memory buffer - no temp files!
            const googleDriveResult = await googleDriveService.uploadOtrosiFileFromBuffer(
              file.buffer,
              contractId,
              otrosiNumber,
              file.originalname
            );

            // Store Google Drive information for later use
            uploadedFiles[fieldName] = {
              originalFile: file,
              googleDriveFileId: googleDriveResult.id,
              googleDriveFileName: googleDriveResult.name,
              originalName: googleDriveResult.originalName,
              size: googleDriveResult.size,
              webViewLink: googleDriveResult.webViewLink
            };

            console.log(`Successfully uploaded ${fieldName} to Google Drive:`, {
              fileId: googleDriveResult.id,
              fileName: googleDriveResult.name
            });

          } catch (uploadError) {
            console.error(`Error uploading ${fieldName} to Google Drive:`, uploadError);
            
            return res.status(500).json({ 
              error: `Failed to upload ${fieldName} to Google Drive: ${uploadError.message}` 
            });
          }
        }
      }

      // No temporary files to clean up - using memory storage! 🎉

      // Attach Google Drive file information to the request for use in route handlers
      req.googleDriveFiles = uploadedFiles;
      
      console.log('All otrosi files successfully uploaded to Google Drive:', {
        contractId,
        otrosiNumber,
        filesUploaded: Object.keys(uploadedFiles)
      });

      next();
    } catch (error) {
      console.error('Error in otrosi Google Drive upload middleware:', error);
      
      // No temporary files to clean up - using memory storage! 🎉

      return res.status(500).json({ 
        error: 'Internal server error during file upload' 
      });
    }
  });
};

// Enhanced contract upload middleware that uploads to Google Drive
const uploadContractWithGoogleDrive = (req, res, next) => {
  // First, use the regular multer upload to handle file validation and temporary storage
  upload.array('files', 10)(req, res, async (err) => {
    if (err) {
      console.error('Multer upload error:', err);
      return res.status(400).json({ error: err.message });
    }

    // If no files were uploaded, continue to the next middleware
    if (!req.files || req.files.length === 0) {
      return next();
    }

    try {
      // Process each uploaded file and upload to Google Drive
      const uploadedFiles = [];
      const contractId = req.body.contractId || 'temp'; // Will be updated after contract creation

      for (const file of req.files) {
        try {
          // Determine file category based on fieldname or filename
          let fileCategory = 'contrato';
          if (file.fieldname === 'oferta' || file.originalname.toLowerCase().includes('oferta')) {
            fileCategory = 'oferta';
          } else if (file.fieldname === 'camara' || file.originalname.toLowerCase().includes('camara')) {
            fileCategory = 'camara';
          }

          console.log(`Uploading contract file to Google Drive from memory buffer:`, {
            originalName: file.originalname,
            bufferSize: file.buffer.length,
            contractId,
            category: fileCategory
          });

          // Upload to Google Drive directly from memory buffer - no temp files!
          const googleDriveResult = await googleDriveService.uploadContractFileFromBuffer(
            file.buffer,
            contractId,
            file.originalname,
            fileCategory
          );

          // Store Google Drive information for later use
          uploadedFiles.push({
            originalFile: file,
            googleDriveFileId: googleDriveResult.id,
            googleDriveFileName: googleDriveResult.name,
            originalName: googleDriveResult.originalName,
            size: googleDriveResult.size,
            webViewLink: googleDriveResult.webViewLink,
            category: fileCategory,
            fieldname: file.fieldname
          });

          console.log(`Successfully uploaded contract file to Google Drive:`, {
            fileId: googleDriveResult.id,
            fileName: googleDriveResult.name,
            category: fileCategory
          });

        } catch (uploadError) {
          console.error(`Error uploading contract file to Google Drive:`, uploadError);
          
          // No temporary files to clean up - using memory storage! 🎉

          return res.status(500).json({ 
            error: `Failed to upload ${file.originalname} to Google Drive: ${uploadError.message}` 
          });
        }
      }

      // No temporary files to clean up - using memory storage! 🎉

      // Attach Google Drive file information to the request for use in route handlers
      req.googleDriveFiles = uploadedFiles;
      
      console.log('All contract files successfully uploaded to Google Drive:', {
        contractId,
        filesUploaded: uploadedFiles.length,
        categories: uploadedFiles.map(f => f.category)
      });

      next();
    } catch (error) {
      console.error('Error in contract Google Drive upload middleware:', error);
      
      // No temporary files to clean up - using memory storage! 🎉

      return res.status(500).json({ 
        error: 'Internal server error during file upload' 
      });
    }
  });
};

module.exports = { upload, uploadOtrosi, uploadOtrosiWithGoogleDrive, uploadContractWithGoogleDrive };