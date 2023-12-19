const sharp = require('sharp');
const fs = require('fs/promises');

async function shrink() {
    try {
        const filePath = '/home/lucasbolt/Lucas-gitprofile/images/gitImageCyber';
        await fs.access(filePath);
        const imageFile = await fs.readFile(filePath);
        const fileBuffer = Buffer.from(imageFile);
        try {
            let info = await sharp(fileBuffer)
            .resize(700, 500)
            .toFile(`${filePath}_${1000}`);                    
            console.log('Thumbnail generated successfully:', info);
        } catch (error) {
            console.error('An error occurred:', error);
        }
        return { status: 'Thumbnail created successfully' };
    } catch(error) {
        console.error(error);
    }
}
shrink()
    .then(console.log('success'));