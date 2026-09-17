import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import multer from 'multer';
import jwt from 'jsonwebtoken';
import {z} from 'zod';
import {generatePitch} from './services/pitch.js';
import {cloudStatus,searchVertex,uploadReference} from './services/google-cloud.js';
import {checkPassword,connectMongo,hashPassword,projects,users} from './services/mongo.js';

const app=express();
const upload=multer({limits:{fileSize:25*1024*1024},fileFilter:(_r,f,cb)=>cb(null,f.mimetype==='application/pdf')});
app.use(cors());
app.use(express.json({limit:'2mb'}));

type User={id:string;email:string;name:string;password:string};
type Project={id:string;userId:string;startupName:string;idea:string;targetAudience:string;industry:string;market:string;revenueModel?:string;traction?:string;team?:string;funding?:string;template?:string;status:string;pitchScore?:number;references:any[];pitch?:any;updatedAt:string};
const secret=process.env.JWT_SECRET||'local-development-only-secret';
const auth=(req:any,res:any,next:any)=>{try{req.user=jwt.verify((req.headers.authorization||'').replace('Bearer ',''),secret);next()}catch{res.status(401).json({error:'Authentication required'})}};
const token=(u:User)=>jwt.sign({id:u.id,email:u.email},secret,{expiresIn:'7d'});
const find=async(id:string,userId:string)=>projects.findOne({id,userId});

app.post('/api/auth/register',async(req,res)=>{
 const data={...req.body,email:String(req.body.email||'').trim().toLowerCase()};
 const s=z.object({name:z.string().min(2),email:z.string().email(),password:z.string().min(8)}).safeParse(data);
 if(!s.success)return res.status(400).json({error:'Please provide a valid name, email and password (8+ characters).'});
 if(await users.findOne({email:s.data.email}))return res.status(409).json({error:'Email already registered'});
 const u:User={id:crypto.randomUUID(),email:s.data.email,name:s.data.name,password:await hashPassword(s.data.password)};
 await users.insertOne(u);
 res.status(201).json({token:token(u),user:{id:u.id,name:u.name,email:u.email}});
});

app.post('/api/auth/login',async(req,res)=>{
 const email=String(req.body.email||'').trim().toLowerCase();
 const u=await users.findOne({email});
 if(!u||!(await checkPassword(String(req.body.password||''),u.password)))return res.status(401).json({error:'Invalid email or password'});
 res.json({token:token(u),user:{id:u.id,name:u.name,email:u.email}});
});

app.get('/api/projects',auth,async(req:any,res)=>res.json(await projects.find({userId:req.user.id}).sort({updatedAt:-1}).toArray()));

app.post('/api/projects',auth,async(req:any,res)=>{
 const s=z.object({startupName:z.string().min(2),idea:z.string().min(20),targetAudience:z.string().min(2),industry:z.string().min(2),market:z.string().min(2),revenueModel:z.string().optional(),traction:z.string().optional(),team:z.string().optional(),funding:z.string().optional(),template:z.string().optional()}).safeParse(req.body);
 if(!s.success)return res.status(400).json({error:'Complete all core startup fields.'});
 const p:Project={id:crypto.randomUUID(),userId:req.user.id,...s.data,status:'Draft',references:[],updatedAt:new Date().toISOString()};
 await projects.insertOne(p);
 res.status(201).json(p);
});

app.get('/api/projects/:id',auth,async(req:any,res)=>{const p=await find(req.params.id,req.user.id);p?res.json(p):res.status(404).json({error:'Project not found'})});

app.post('/api/projects/:id/references',auth,upload.single('file'),async(req:any,res)=>{
 const p=await find(req.params.id,req.user.id);
 if(!p)return res.status(404).json({error:'Project not found'});
 if(!req.file)return res.status(400).json({error:'Please upload a PDF under 25MB.'});
 try{
  const storagePath=await uploadReference(req.file.buffer,req.user.id,p.id,req.file.originalname);
  const d={id:crypto.randomUUID(),fileName:req.file.originalname,storagePath,status:'Completed',pages:'Pending extraction',indexed:cloudStatus.vertexVectorSearch,createdAt:new Date().toISOString()};
  await projects.updateOne({id:p.id,userId:req.user.id},{$push:{references:d},$set:{updatedAt:new Date().toISOString()}});
  res.status(202).json(d);
 }catch(error){console.error('Reference upload failed.',error);res.status(502).json({error:'Reference storage is unavailable. Check Google Cloud credentials and bucket access.'})}
});

app.post('/api/projects/:id/generate',auth,async(req:any,res)=>{
 const p=await find(req.params.id,req.user.id);
 if(!p)return res.status(404).json({error:'Project not found'});
 const vertexSources=await searchVertex(p.idea).catch(error=>{console.error('Vertex Vector Search unavailable.',error);return []});
 p.pitch=await generatePitch(p,[...p.references.map(r=>r.fileName),...vertexSources]);
 p.pitchScore=p.pitch.pitchScore;p.status='Ready';p.updatedAt=new Date().toISOString();
 await projects.updateOne({id:p.id,userId:req.user.id},{$set:{pitch:p.pitch,pitchScore:p.pitchScore,status:p.status,updatedAt:p.updatedAt}});
 res.json(p.pitch);
});

app.get('/api/projects/:id/pitch',auth,async(req:any,res)=>{const p=await find(req.params.id,req.user.id);if(!p)return res.status(404).json({error:'Project not found'});p.pitch?res.json(p.pitch):res.status(404).json({error:'Pitch has not been generated'})});

app.put('/api/projects/:id/slides/:slideId',auth,async(req:any,res)=>{
 const p=await find(req.params.id,req.user.id),slide=p?.pitch?.slides.find((s:any)=>s.id===req.params.slideId);
 if(!p||!slide)return res.status(404).json({error:'Slide not found'});
 Object.assign(slide,req.body);p.updatedAt=new Date().toISOString();
 await projects.updateOne({id:p.id,userId:req.user.id},{$set:{pitch:p.pitch,updatedAt:p.updatedAt}});
 res.json(slide);
});

app.post('/api/projects/:id/slides/:slideId/improve',auth,async(req:any,res)=>{
 const p=await find(req.params.id,req.user.id),s=p?.pitch?.slides.find((q:any)=>q.id===req.params.slideId);
 if(!p||!s)return res.status(404).json({error:'Slide not found'});
 const instruction=req.body.instruction||'Make investor-focused';
 const trim=(v:string)=>v.replace(/\s+/g,' ').replace(/[. ]+$/,'');
 if(instruction==='Make concise'){s.subtitle=trim(s.subtitle);s.content=s.content.map((c:string)=>trim(c).split(/(?<=[.!?])\s+/)[0]+'.').slice(0,3)}
 else if(instruction==='Strengthen the narrative'){s.subtitle='A clear, defensible case for '+p.startupName+'.';s.content=s.content.map((c:string)=>trim(c).replace(/should be|need to|requires?/gi,'must').replace(/designed for/gi,'built for').replace(/turns the stated challenge into/gi,'delivers'))}
 else{s.subtitle='Why this matters: '+p.startupName+' creates a measurable path to customer value and scalable growth.';s.content=[...s.content.filter((c:string)=>!/^Validate|^Use a bottoms-up|^Unit economics|^If not provided|^Highlight|^Tie use of funds|^Build a three-year|^CAC,/i.test(c)),'Investor lens: customer pain, differentiated solution, and the proof point that unlocks scale.'].slice(0,3)}
 p.updatedAt=new Date().toISOString();
 await projects.updateOne({id:p.id,userId:req.user.id},{$set:{pitch:p.pitch,updatedAt:p.updatedAt}});
 res.json(s);
});

app.get('/health',(_q,res)=>res.json({ok:true,mode:cloudStatus.project?'gcp-configured':'local-demo',cloud:cloudStatus,mongo:Boolean(process.env.MONGODB_URI)}));
app.use((_q,res)=>res.status(404).json({error:'Route not found'}));
app.use((e:any,_q:any,res:any,_n:any)=>res.status(400).json({error:e.message||'Request failed'}));

async function start(){await connectMongo();app.listen(process.env.PORT||4000,()=>console.log('API listening'))}
start().catch(error=>{console.error('Unable to start API.',error);process.exit(1)});
