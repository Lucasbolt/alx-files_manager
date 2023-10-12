import dbClient from '../utils/db';
import { userQueue } from '../worker';
const crypto = require('crypto');

export default class UserController {
  static async postNew(req, res) {
    const { email } = req.body;
    const { password } = req.body;
    if (!email) {
      res.status(400).json({ error: 'Missing email' });
      return;
    }
    if (!password) {
      res.status(400).json({ error: 'Missing password' });
      return;
    }
    const user = await (await dbClient.userCollection()).findOne({ email });
    if (user) {
      res.status(400).json({ error: 'Alreay exist' });
      return;
    }
    const hashP = crypto.createHash('sha1').update(password).digest('hex');
    const insertInfo = await (await dbClient.userCollection())
      .insertOne({ email: `${email}`, password: hashP });
    const userId = insertInfo.insertedId.toString();
    userQueue.add({userId: userId});
    res.status(200).json({ id: userId, email });
  }
}
