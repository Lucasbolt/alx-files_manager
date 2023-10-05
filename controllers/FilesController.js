require('dotenv').config();
import dbClient from "../utils/db";
import {
    getUserId,
} from "../utils/auth";
const fs = require('fs');
import fileQueue from "../worker";
import FileHandler from "../utils/files";
import { v4 } from 'uuid';
import mime from 'mime-types';


export default class FilesController {
    static async postUpload(req, res) {
        const userId = await getUserId(req);
        if (!userId) {
            res.status(401).json({error: 'Unauthorized'});
            return;
        };
        const acceptedTypes = ['file', 'folder', 'image'];
        const name = req.body.name || null;
        const type = req.body.type || null;
        const parentId = req.body.parentId || 0;
        const isPublic = req.body.isPublic || false;
        const data = req.body.data || null;

        if(!name) {
            res.status(400).json({error: 'Missing name'});
            return;
        };
        if(!acceptedTypes.includes(type)) {
            res.status(400).json({error: 'Missing type'});
            return;
        };
        if (!data && type !== 'folder') {
            res.status(400).json({error: 'Missing data'});
            return;
        };
        if (parentId !== 0) {
            const pfile = await FileHandler.findFileById(parentId);
            if (!pfile) {
                res.status(400).json({error: 'Parent not found'});
                return;
            };
            if (pfile.type !== 'folder') {
                res.status(400).json({error: 'Parent is not a folder'});
                return;
            };
        };
        if (type === 'folder') {
            const fileDocument =  { 
                userId,
                name,
                type,
                parentId,
                isPublic
             };
            const fileInsertInfo = await (await dbClient.fileCollection())
            .insertOne(fileDocument);
            const id = fileInsertInfo.insertedId.toString();
            res.status(200).json({ id, ...fileDocument });
        } else {
            const fileContent = Buffer.from(data, 'base64');
            const rfilePath = process.env.FOLDER_PATH || '/tmp/files_manager';
            let localPath  = v4(name);
            const fstatus = await FileHandler.folderManager(rfilePath);
            if (fstatus) {
                fs.writeFile(`${rfilePath}/${localPath}`, fileContent, (err) => {
                    if (err) {
                      console.error('Error writing to the file:', err);
                    } else {
                      console.log('Data has been written to the file successfully.');
                    }
                  });
            } else {
                res.status(500).json({error: 'Server error'});
                return;
            };
            const fileDocument =  { 
                userId,
                name,
                type,
                parentId,
                isPublic,
                localPath
            };
            const fileInsertInfo = await (await dbClient.fileCollection())
            .insertOne(fileDocument);
            const id = fileInsertInfo.insertedId.toString();
            if (type === 'image') {
                fileQueue.add({userId: userId, fileId: id});
            }
            res.status(200).json({ id, ...fileDocument });
        }
    }

    static async getshow(req, res) {
        const userId = await getUserId(req);
        if (!userId) {
            res.status(401).json({error: 'Unauthorized'});
            return;
        };
        const fileId = req.params.id;
        if (!fileId) {
            res.status(404).json({error: 'Not found'});
            return
        };
        const userFile = await (FileHandler.findFilesByU_Id(userId, fileId));
        if (!userFile) {
            res.status(400).json({error: 'Not found'});
            return;
        }
        res.status(200).json({...userFile});
        return;
    }

    static async getIndex(req, res) {
        const userId = await getUserId(req);
        if (!userId) {
            res.status(401).json({error: 'Unauthorized'});
            return;
        };
        let { parentId, page } = req.query;
        if (parentId === '0' || !parentId) parentId = 0;
        page = Number.isNaN(page) ? 0 : Number(page);
        let page_size = 20;
        let start_page = page * page_size;
        let end_page = start_page + page_size;
        const files = await (await dbClient.fileCollection()).find(
            {
                userId: userId,
                parentId: parentId
            }
        ).toArray();
        if (!files) {
            res.status(404).json({error: 'Not found'});
            return;
        }
        const result = [];
        for (const item of files) {
            result.push(FileHandler.replaceDefaultMongoId(item));
        };
        if (start_page > result.length){
            res.status(404).json({error: 'Not found'});
            return;
        }
        res.status(200).send(result.slice(start_page, end_page));
    }

    static async putPublish(req, res) {
        const userId = await getUserId(req);
        const fileId = req.params.id;
        if (!userId) {
            res.status(401).json({error: 'Unauthorized'});
            return;
        };
        const updateDoc = {isPublic: true};
        const result = await FileHandler.updateFileByU_Id(userId, fileId, updateDoc);
        if (!result) {
            res.status(404).json({error: 'Not Found'});
            return;
        }
        res.status(200).json(result);
        return;
    }

    static async putUnPublish(req, res) {
        const userId = await getUserId(req);
        const fileId = req.params.id;
        if (!userId) {
            res.status(401).json({error: 'Unauthorized'});
            return;
        };
        const updateDoc = {isPublic: false};
        const result = await FileHandler.updateFileByU_Id(userId, fileId, updateDoc);
        if (!result) {
            res.status(404).json({error: 'Not Found'});
            return;
        }
        res.status(200).json(result);
        return;
    }

    static async getFile(req, res) {
        const userId = await getUserId(req);
        const fileId = req.params.id;
        const { size } = req.query;
        const file = await FileHandler.findFileById(fileId);
        if (!file.isPublic && userId !== file.userId) {
            return res.status(404).json({error: 'Not found'});
        }
        if(!file) {
            return res.status(404).json({error: 'Not found'});
        }
        if (file.type === 'folder') {
            return res.status(400).json({error: "A folder doesn't have content"});
        }
        const rootDir =  process.env.FOLDER_PATH || '/tmp/files_manager';
        let filePath = `${rootDir}/${file.localPath}`;
        if (!Number.isNaN(size) && [500, 250, 100].includes(Number(size))) {
            filePath += `_${size}`;
        };

        if (!fs.existsSync(filePath)) {
            return res.status(404).json({error: 'Not found'});
        }
        const mimetype = mime.lookup(file.name);
        res.set('Content-Type', mimetype);
        const data = fs.readFileSync(filePath);
        return res.status(200).send(data);
    }
}