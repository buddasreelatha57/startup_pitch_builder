import {GoogleGenAI} from '@google/genai';

export const slideTypes = ['problem','solution','market','business_model','competition','gtm','team','financials','traction','funding'] as const;
export type SlideType = typeof slideTypes[number];
export type Slide = { id:string; slideNumber:number; type:SlideType; title:string; subtitle:string; content:string[]; metrics:{label:string;value:string;source?:string}[]; assumptions:string[]; sources:string[] };
type Input={startupName:string;idea:string;targetAudience:string;industry:string;market:string;revenueModel?:string;traction?:string;team?:string;funding?:string;template?:string};
const themes:Record<string,{id:string;background:string;accent:string;text:string;muted:string}>={signal:{id:'signal',background:'10282c',accent:'20c5b3',text:'f1fffd',muted:'91aaa8'},terra:{id:'terra',background:'25352f',accent:'d4e27b',text:'f7f8e9',muted:'b2c0a7'},editorial:{id:'editorial',background:'f2ede3',accent:'bd5b3e',text:'26312f',muted:'6e7770'},ledger:{id:'ledger',background:'17253b',accent:'e7b96b',text:'f5f4ed',muted:'a7b7cc'},care:{id:'care',background:'e7f1ef',accent:'257d7a',text:'173b3b',muted:'658988'}};
const labels:Record<SlideType,string>={problem:'Problem',solution:'Solution',market:'Market Size',business_model:'Business Model',competition:'Competitive Landscape',gtm:'Go-To-Market',team:'Team Composition',financials:'Financial Projections',traction:'Traction Metrics',funding:'Funding Ask'};
function missing(v?:string){return v?.trim()||'Not provided';}
export async function generatePitch(input:Input, references:string[]=[]){
 if(process.env.GEMINI_API_KEY||(process.env.GOOGLE_GENAI_USE_ENTERPRISE==='true'&&process.env.GOOGLE_CLOUD_PROJECT)){
  try{return await generateWithGemini(input,references)}catch(error){console.error('Gemini generation failed; using local generator.',error)}
 }
 return generateLocalPitch(input,references);
}
async function generateWithGemini(input:Input,references:string[]){
 const useVertex=process.env.GOOGLE_GENAI_USE_ENTERPRISE==='true'&&process.env.GOOGLE_CLOUD_PROJECT;
 const ai=useVertex?new GoogleGenAI({vertexai:true,project:process.env.GOOGLE_CLOUD_PROJECT,location:process.env.GOOGLE_CLOUD_LOCATION||'global'}):new GoogleGenAI({apiKey:process.env.GEMINI_API_KEY});
 const response=await ai.models.generateContent({model:process.env.GEMINI_MODEL||'gemini-2.5-flash',contents:`Create an investor-ready startup pitch as JSON for this company:
${JSON.stringify(input)}
Reference decks: ${references.join(', ')||'None'}

Return only JSON with this shape: {"startupName":string,"pitchScore":number,"theme":${JSON.stringify(themes.signal)},"slides":Slide[]}. Include exactly these slide types in order: ${slideTypes.join(', ')}. Each Slide must contain id, slideNumber, type, title, subtitle, content (array of strings), metrics (array of {label,value,source}), assumptions (array of strings), and sources (array of strings). Never invent customer, revenue, market, traction, team, or partnership facts. Mark missing evidence as "Not provided" or "Assumption required". Use the provided reference filenames only as source labels.`,config:{responseMimeType:'application/json'}});
 const parsed=JSON.parse(response.text||'');
 if(!parsed.startupName||!Array.isArray(parsed.slides)||parsed.slides.length!==slideTypes.length)throw Error('Gemini returned an invalid pitch shape');
 return parsed;
}
function generateLocalPitch(input:Input,references:string[]=[]){
 const known=references.length?['Reference-derived patterns from '+references.slice(0,3).join(', ')]:['No reference evidence available'];
 const slides:Slide[]=slideTypes.map((type,i)=>({id:crypto.randomUUID(),slideNumber:i+1,type,title:labels[type],subtitle:'Investor-ready view for '+input.startupName,content:content(type,input),metrics:metrics(type,input),assumptions:assumptions(type,input),sources:known}));
 const score=Math.min(92,55+(input.idea.length>80?8:2)+(references.length?12:0)+(input.traction?5:0)+(input.team?4:0));
 return {startupName:input.startupName,pitchScore:score,theme:themes[input.template||'signal']||themes.signal,slides};
}
function content(t:SlideType,x:Input){const aud=missing(x.targetAudience), market=missing(x.market); const map:Record<SlideType,string[]>={
 problem:[`${aud} face fragmented, inefficient workflows in ${x.industry}.`,`${x.idea}`,'Validate pain intensity with customer interviews before fundraising.'],
 solution:[`${x.startupName} turns the stated challenge into a focused, measurable workflow.`,`Designed for ${aud} in ${market}.`],
 market:[`TAM / SAM / SOM should be validated for ${market}.`,'Use a bottoms-up model based on reachable customers and annual spend.'],
 business_model:[`Revenue model: ${missing(x.revenueModel)}.`,'Unit economics, pricing, CAC and payback require validation.'],
 competition:[`Map alternatives used by ${aud}.`,`Differentiate on focus, workflow depth, and distribution—not unsupported claims.`],
 gtm:[`Start with a narrow beachhead within ${market}.`,'Land early design partners, prove outcomes, then scale repeatable channels.'],
 team:[`Current team: ${missing(x.team)}.`,'Highlight founder-market fit and identify critical hiring gaps.'],
 financials:['Build a three-year driver-based model.','Revenue, margin, CAC, and runway are assumption-required until user-provided.'],
 traction:[`Current traction: ${missing(x.traction)}.`,'If not provided, show milestones rather than invented customer metrics.'],
 funding:[`Funding requirement: ${missing(x.funding)}.`,'Tie use of funds to product, go-to-market, and measurable milestones.']};return map[t];}
function metrics(t:SlideType,x:Input){if(t==='market')return [{label:'TAM',value:'Assumption required',source:'Estimated'},{label:'SAM',value:'Assumption required',source:'Estimated'},{label:'SOM',value:'Assumption required',source:'Estimated'}];if(t==='traction')return [{label:'Traction',value:missing(x.traction),source:x.traction?'User-provided':'Not provided'}];if(t==='funding')return [{label:'Capital sought',value:missing(x.funding),source:x.funding?'User-provided':'Not provided'}];return [];}
function assumptions(t:SlideType,x:Input){return ['All unprovided revenue, customer, market and partnership claims remain assumptions.', ...(t==='financials'?['CAC, conversion rate, pricing, and churn need validation.']:[])];}
