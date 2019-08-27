export interface User {
    id: number;
    projectId: number;
    creationTime: string;
    phoneNumber: string;
    email: string;
    name: string;
    verified: boolean;
}

export interface LoginInfo {
    user: User;
    authToken: string;
    projectId: number;
}
  
export interface ClientAuthInfo {
    token: string;
    userId: number;
}
export interface ClientStorageData {
    value: any;
    expire?: number;
}