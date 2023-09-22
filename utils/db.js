import { MongoClient, ObjectId } from 'mongodb';

class DBClient {
  constructor() {
    this.host = process.env.DB_HOST || 'localhost';
    this.port = process.env.DB_PORT || 27017;
    this.database = process.env.DB_DATABASE || 'files_manager';
    const url = `mongodb://${this.host}:${this.port}/${this.database}`;
    this.client = new MongoClient(url, { family: 4, useUnifiedTopology: true });
    this.client.connect();
  }

  isAlive() {
    return this.client.isConnected();
  }

  async nbUsers() {
    return this.client.db().collection('users').countDocuments();
  }

  async nbFiles() {
    return this.client.db().collection('files').countDocuments();
  }

  async userCollection() {
    return this.client.db().collection('users');
  }
  async fileCollection() {
    return this.client.db().collection('files');
  }
  async findFilesByPid(id) {
    return await (await this.fileCollection()).findOne({parentId: ObjectId(id)});
  }
}

export const dbClient = new DBClient();
export default dbClient;
