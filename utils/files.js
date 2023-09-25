const fs = require('fs/promises'); // Use fs.promises for promise-based file system operations
import dbClient from './db';
import { ObjectId } from 'mongodb';

export default class FileHandler {
  static async folderManager(folderName) {
    try {
      const stats = await fs.stat(folderName);
      // The folder already exists
      return 1;
    } catch (err) {
      if (err.code === 'ENOENT') {
        // The folder doesn't exist, so create it
        try {
          await fs.mkdir(folderName);
          console.log('Folder created successfully.');
          return 1;
        } catch (createErr) {
          console.error('Error creating folder:', createErr);
          return null;
        }
      } else {
        // An error occurred other than 'ENOENT' (e.g., permissions issue)
        console.error('Error checking folder existence:', err);
        return null;
      }
    }
  }
  static async findFilesByU_Id(userId, fileId, removeLocalPath = true) {
    const files = await (await dbClient.fileCollection());
    if (!ObjectId.isValid(fileId)) {return null;};
    const userFile = await files.findOne({
      userId,
      _id: ObjectId(fileId)
    });
    if (!userFile) {return null;};
    if (removeLocalPath) {
      const result = this.removeLocalPath(userFile);
      return this.replaceDefaultMongoId(result);
    }
    return this.replaceDefaultMongoId(userFile);
  }

  static removeLocalPath(document) {
    const doc = document;
    delete doc.localPath;
    return doc;
  }

  static replaceDefaultMongoId(document) {
    const { _id, ...rest } = document;
    return { id: _id, ...rest };
  }

  static async updateFileByU_Id(userId, fileId, updateDoc) {
    const filter = {
      userId,
      _id: ObjectId(fileId)
    };
    const updateDocument = {
      $set: updateDoc,
    };
    try {
      const result = await (await dbClient.fileCollection()).updateOne(filter, updateDocument);
      if (result.modifiedCount === 1) {
        console.log('Document updated successfully');
        return await this.findFilesByU_Id(userId, fileId);
      } else {
        console.log('Document not found or no changes made');
        return null;
      }
    } catch (err) {
      console.error('Error updating document:', err);
  }
  }

  static async findFileById(id) {
    if (!ObjectId.isValid(id)) {
      return null;
    }
    return await (await dbClient.fileCollection()).findOne({_id: ObjectId(id)});
  }
}
