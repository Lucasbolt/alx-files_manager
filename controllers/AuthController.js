import dbClient from "../utils/db";
import redisClient from "../utils/redis";
const crypto = require('crypto');
const uuid = require('uuid');
import {ObjectId} from 'mongodb';
import { getUserToken,
         getUserId,
        } from "../utils/auth";

export default class AuthController {
  static async getConnect(req, res) {
    const headerAuth = req.get('Authorization') || null;
    
    if (!headerAuth) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    const decodedHeader = headerAuth.split('Basic ')[1];
    const decodedAuth = Buffer.from(decodedHeader, 'base64').toString(); // Use Buffer to decode base64
    
    const [email, password] = decodedAuth.split(':');
    const hashP = crypto.createHash('sha1').update(password).digest('hex');
    
    const user = await (await dbClient.userCollection()).findOne({ email });
    
    if (!user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    
    if (user.password === hashP) {
      const u_id = uuid.v4(); // Use uuid.v4() to generate a UUID
      redisClient.set(`auth_${u_id}`, user._id.toString(), 86400) // Use 'EX' to set expiration time in seconds
        .then(() => {
          res.status(200).json({token: u_id});
        })
        .catch(err => {
          console.error('Error occurred while saving key in Redis:', err);
          res.status(500).json({ error: "Internal Server Error" });
        });
    } else {
      res.status(401).json({ error: "Unauthorized" });
    }
  }

  static async getDisconnect(req, res) {
    const token = req.get('X-Token');
    const userId = await getUserId(token);
    if (!userId) {
      res.status(401).json({error: 'Unauthorized'});
      return;
    }
    const user = await (await dbClient.userCollection())
    .find({_id: `ObjectId("${userId}")`});
    if (user) {
      await redisClient.del(`auth_${token}`);
      res.status(204).send();
      return;
    } else {
      res.status(401).json({error: 'Unauthorized'});
      return;
    }
  }

  static async getMe(req, res) {
    const userId = await getUserId(req);
    if (!userId) {
      res.status(401).json({error: 'Unauthorized'});
      return;
    };
    const user = await (await dbClient.userCollection())
    .findOne({_id: ObjectId(userId)});
    res.status(200).json({email: user.email, id: user._id});
  }
}