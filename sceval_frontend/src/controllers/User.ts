export default interface User {
  id: number;
  projectId: number;
  creationTime: string;
  phoneNumber: string;
  email: string;
  name: string;
  verified: boolean;
}