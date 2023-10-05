const imageThumbnail = require('image-thumbnail');
const fs = require('fs');
const sharp = require('sharp');

const file = '/home/lucasbolt/Pictures/pic';
const outputFilePath = '/home/lucasbolt/Pictures/pic_450';

const generateThumbnail = async () => {
  try {
    // Generate a thumbnail with a width of 250 pixels and base64 response type
    sharp(file)
      .resize(250)
      .toFile(outputFilePath, (err, info) => {
        if (err) {
          console.error('Error generating thumbnail:', err);
        } else {
          console.log('Thumbnail generated successfully:', info);
        }
      });
  } catch (error) {
    // Handle any errors that may occur during the process
    console.error('An error occurred:', error);
  }
};

// Call the function to generate the thumbnail
generateThumbnail();
