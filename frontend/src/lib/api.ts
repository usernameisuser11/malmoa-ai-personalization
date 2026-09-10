import type { AacSymbol,CommunicationProfile,Comparison,GuardianNotification,RecommendationStats,UserSettings } from '@/types';

const BASE=process.env.NEXT_PUBLIC_API_BASE_URL??'http://localhost:8080';
async function request<T>(path:string,init?:RequestInit):Promise<T>{const response=await fetch(`${BASE}${path}`,{...init,headers:{'Content-Type':'application/json',...(init?.headers??{})}});const text=await response.text();if(!response.ok)throw new Error(text||`API ${response.status}`);if(!text)return undefined as T;return JSON.parse(text) as T;}
export const api={
  getUserSettings:(userId:number)=>request<UserSettings>(`/api/users/${userId}/settings`),
  saveUserSettings:(userId:number,settings:Omit<UserSettings,'userId'>)=>request<UserSettings>(`/api/users/${userId}/settings`,{method:'PUT',body:JSON.stringify(settings)}),
  getProfile:(userId:number)=>request<CommunicationProfile>(`/api/users/${userId}/communication-profile`),
  saveProfile:(userId:number,profile:Omit<CommunicationProfile,'userId'>)=>request<CommunicationProfile>(`/api/users/${userId}/communication-profile`,{method:'PUT',body:JSON.stringify(profile)}),
  getSymbols:(userId:number)=>request<AacSymbol[]>(`/api/users/${userId}/symbols`),
  getEmergencySymbols:(userId:number)=>request<AacSymbol[]>(`/api/users/${userId}/emergency-symbols`),
  customizeSymbol(userId:number,symbolId:number,body:Partial<AacSymbol>){return request<AacSymbol>(`/api/users/${userId}/symbols/${symbolId}`,{method:'PUT',body:JSON.stringify({displayText:body.displayText??null,ttsText:body.ttsText??null,userAlias:body.userAlias??null,customImageUrl:body.imageUrl??null,favorite:body.favorite??false,importantWord:body.importantWord??false,sortOrder:body.sortOrder??null})});},
  recordUsage:(userId:number,words:string[])=>request<void>(`/api/users/${userId}/usage`,{method:'POST',body:JSON.stringify({words})}),
  compare:(body:{userId:number;situation:string;intent:string;selectedWords:string[]})=>request<Comparison>('/api/recommendations/compare',{method:'POST',body:JSON.stringify(body)}),
  markRecommendationSelected:(userId:number,mode:'baseline'|'personalized',sentence:string)=>request<void>('/api/recommendations/selection',{method:'POST',body:JSON.stringify({userId,mode,sentence})}),
  recommendationStats:(userId:number)=>request<RecommendationStats>(`/api/recommendations/stats/${userId}`),
  experimentExportUrl:(userId:number)=>`${BASE}/api/recommendations/export/${userId}`,
  notifications:(userId:number)=>request<GuardianNotification[]>(`/api/users/${userId}/notifications`),
  markNotificationRead:(userId:number,id:number)=>request<GuardianNotification>(`/api/users/${userId}/notifications/${id}/read`,{method:'PATCH'}),
};
