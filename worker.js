const Queue = require('bull');
const fs = require('fs/promises');
const sharp = require('sharp');
import FileHandler from './utils/files';
const app = require('./server');
require('dotenv').config();

const widths = [500, 250, 100]
const rootDir = process.env.FOLDER_PATH || '/tmp/files_manager';

const fileQueue = new Queue('image thumbnail processing');

fileQueue.process(
    async (job) => {
        try {
            const fileId = job.data.fileId;
            const userId = job.data.userId;
            if (!fileId) {
                throw new Error('Missing fileId');
            }
            if (!userId) {
                throw new Error('Missing userId');
            }
            const file  = await FileHandler.findFilesByU_Id(userId, fileId, false);
            if (!file) {
                throw new Error('File not found');
            }
            const filePath = `${rootDir}/${file.localPath}`;
            await fs.access(filePath);
            const imageFile = await fs.readFile(filePath);
            const fileBuffer = Buffer.from(imageFile, 'base64');
            for (const size of widths) {
                try {
                    let info = await sharp(fileBuffer)
                    .resize(size)
                    .toFile(`${filePath}_${size}`);                    
                    console.log('Thumbnail generated successfully:', info);
                } catch (error) {
                    console.error('An error occurred:', error);
                }
            }
            return { status: 'Thumbnail created successfully' };
        } catch(error) {
            console.error(`fileQueue: ${error}`);
        }
    }
);

fileQueue.on('completed', (job, result) => {
    console.log(`Job ID ${job.id} completed with result: ${JSON.stringify(result)}`);
  });
  
  // Listen for any failed jobs
fileQueue.on('failed', (job, err) => {
    console.error(`Job ID ${job.id} failed with error: ${err}`);
});
  
  // Gracefully shut down the queue when needed
process.on('SIGTERM', () => {
    fileQueue.close();
    process.exit(0);
});

export default fileQueue;