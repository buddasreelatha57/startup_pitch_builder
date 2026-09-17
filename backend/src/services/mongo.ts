import {MongoClient,Collection} from 'mongodb';
import bcrypt from 'bcryptjs';

type User={id:string;email:string;name:string;password:string};
type Project={id:string;userId:string;startupName:string;idea:string;targetAudience:string;industry:string;market:string;revenueModel?:string;traction?:string;team?:string;funding?:string;template?:string;status:string;pitchScore?:number;references:any[];pitch?:any;updatedAt:string};

const uri=process.env.MONGODB_URI;
if(!uri)throw Error('MONGODB_URI is required');
const client=new MongoClient(uri);
const database=client.db(process.env.MONGODB_DB||'startup_pitch_builder');
export const users:Collection<User>=database.collection('users');
export const projects:Collection<Project>=database.collection('projects');

export async function connectMongo(){
 await client.connect();
 await users.createIndex({email:1},{unique:true});
 await projects.createIndex({userId:1,updatedAt:-1});
 console.log(`MongoDB connected: ${database.databaseName}`);
}
export async function hashPassword(password:string){return bcrypt.hash(password,12);}
export async function checkPassword(password:string,hash:string){return bcrypt.compare(password,hash);}
