export interface User {
    // user id
    id: number;
    // project id
    projectId: number;
    // project creation time
    creationTime: string;
    // user phone number
    phoneNumber: string;
    // user email
    email: string;
    // user name
    name: string;
    // user verified status
    verified: boolean;
}

export interface LoginInfo {
    // user object
    user: User;
    // user authentication token
    authToken: string;
    // project id
    projectId: number;
}
  
export interface ClientAuthInfo {
    // user auth token
    token: string;
    // user id
    userId: number;
}
export interface ClientStorageData {
    // client storage value
    value: any;
    // data expiration
    expire?: number;
}