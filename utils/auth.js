import dbClient from "./db";
import redisClient from "./redis";

export function getUserToken(req) {
    const token = req.get('X-Token') || null;
    return token;
}

export async function getUserId(req) {
    const token = getUserToken(req);
    const userId = await redisClient.get(`auth_${token}`) || null;
    return userId;
}
export async function getCurrentUser(req) {
    const token = getUserToken(req);
    if (token){
        const userId = getUserId(token);
        if (userId) {
            return await (await dbClient.userCollection()).findOne({_id: ObjectId(userId)});
        } else {return null;};
    }
    return null;
}