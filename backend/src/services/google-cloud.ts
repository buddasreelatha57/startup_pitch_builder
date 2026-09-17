import {Storage} from '@google-cloud/storage';
import {GoogleAuth} from 'google-auth-library';

const projectId=process.env.GOOGLE_CLOUD_PROJECT;
const location=process.env.GOOGLE_CLOUD_LOCATION||'global';
const bucketName=process.env.GCS_BUCKET;
const vectorEndpointId=process.env.VERTEX_VECTOR_INDEX_ENDPOINT;
const deployedIndexId=process.env.VERTEX_DEPLOYED_INDEX_ID;
const storage=projectId&&bucketName?new Storage({projectId}):null;

export const cloudStatus={
  project:projectId||null,
  location,
  gcs:Boolean(storage),
  vertexVectorSearch:Boolean(projectId&&location&&vectorEndpointId&&deployedIndexId),
};

export async function uploadReference(buffer:Buffer,userId:string,projectIdForFile:string,fileName:string){
  if(!storage||!bucketName)return null;
  const safeName=fileName.replace(/[^a-zA-Z0-9._-]/g,'_');
  const objectName=`users/${userId}/projects/${projectIdForFile}/references/${crypto.randomUUID()}-${safeName}`;
  await storage.bucket(bucketName).file(objectName).save(buffer,{contentType:'application/pdf',resumable:false,metadata:{cacheControl:'private, max-age=0'}});
  return `gs://${bucketName}/${objectName}`;
}

export async function searchVertex(query:string){
  if(!projectId||!vectorEndpointId||!deployedIndexId)return [];
  const auth=new GoogleAuth({scopes:'https://www.googleapis.com/auth/cloud-platform'});
  const client=await auth.getClient();
  const token=await client.getAccessToken();
  const base=`https://${location}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${location}`;
  const embeddingResponse=await fetch(`${base}/publishers/google/models/text-embedding-005:predict`,{method:'POST',headers:{Authorization:`Bearer ${token.token}`, 'Content-Type':'application/json'},body:JSON.stringify({instances:[{content:query}],parameters:{autoTruncate:true}})});
  if(!embeddingResponse.ok)throw Error(`Vertex embedding request failed: ${embeddingResponse.status}`);
  const embeddingBody=await embeddingResponse.json() as any;
  const vector=embeddingBody.predictions?.[0]?.embeddings?.values;
  if(!Array.isArray(vector))throw Error('Vertex embedding response did not contain a vector');
  const neighborsResponse=await fetch(`${base}/indexEndpoints/${vectorEndpointId}:findNeighbors`,{method:'POST',headers:{Authorization:`Bearer ${token.token}`, 'Content-Type':'application/json'},body:JSON.stringify({deployedIndexId,queries:[{datapoint:{datapointId:crypto.randomUUID(),featureVector:vector},neighborCount:3}]})});
  if(!neighborsResponse.ok)throw Error(`Vertex Vector Search request failed: ${neighborsResponse.status}`);
  const neighborsBody=await neighborsResponse.json() as any;
  return (neighborsBody.nearestNeighbors?.[0]?.neighbors||[]).map((neighbor:any)=>`Vertex reference ${neighbor.datapoint?.datapointId||'unknown'} (distance ${neighbor.distance??'unknown'})`);
}
