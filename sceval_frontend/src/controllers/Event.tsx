export default interface Event {
  eventType: string;
  eventData: any;
  timestamp: string;
  homeId: number;
  originDeviceId: number;
  originDeviceClass: string;
  originDeviceIp: string;
  originProjectKeyId: string;
  originProjectKeyName: string;
}