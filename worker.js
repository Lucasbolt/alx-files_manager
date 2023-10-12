const Queue = require('bull');
const fs = require('fs/promises');
const sharp = require('sharp');
import FileHandler from './utils/files';
const app = require('./server');
import dbClient from './utils/db';
import { ObjectId }  from 'mongodb';
import { sendEmail } from './utils/emailbuilder';
const ejs = require('ejs');
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
  


const userQueue = new Queue('Welcome mail');
userQueue.process(
    async (job) => {
        try {
            const userId = job.data.userId;
            if (!userId) {
                throw new Error('Missing userId');
            }
            const userCollection = await dbClient.userCollection();
            const user = await userCollection.findOne({_id: ObjectId(userId)});
            if (!user) {
                throw new Error('User not found');
            }
            let name = user.email.split('@')[0];
            const template = await fs.readFile('./templates/welcomemail.ejs', 'utf-8');
            const renderedEmail = ejs.render(template, {username: name})
            const data = {
                sender: {
                    name: "knowshare",
                    email: "lucasbolt700@gmail.com"
                },
                to: [
                    {
                        email: user.email,
                        name: name
                    }
                ],
                subject: "Welcome to ALX files manager!",
                htmlContent: renderedEmail
            }
            await sendEmail(data);
            console.log(`Welcome ${user.email}!`);
            return {status: 'Email successfully sent'};
        } catch(error) {
            console.error(error);
        }
    }
);

userQueue.on('completed', (job, result) => {
    console.log(`job ID ${job.id} completed with result: ${JSON.stringify(result)}`);
});

userQueue.on('failed', (job, err) => {
    console.error(`Job ID ${job.id} failed with error: ${err}`);
});
process.on('SIGTERM', () => {
    fileQueue.close();
    userQueue.close();
    process.exit(0);
});

module.exports = {
    fileQueue,
    userQueue
}