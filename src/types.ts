import { VCRServiceAPI } from './vcrServiceAPI';

type App = 'CORE' | 'EXTERNAL';

// messages
interface Message {
  id: string;
  from: App;
  to: App;
  action: string;
}
export interface RequestMessage extends Message {
  messageType: 'REQUEST';
  payload?: any;
}

export interface ResponseMessage extends Message {
  messageType: 'RESPONSE';
  payload?: any;
  error?: Error;
}

export type MessageHandler = (e: MessageEvent) => void;

// actions
export const RequestAction = {
  ToggleTimer: 'TOGGLE_TIMER',
  ToggleRoster: 'TOGGLE_ROSTER',
  ToggleChat: 'TOGGLE_CHAT',
  ToggleMaterial: 'TOGGLE_MATERIAL',
  ToggleLayout: 'TOGGLE_LAYOUT',
  ToggleMediaCapture: 'TOGGLE_MEDIA_CAPTURE',
  ToggleNetworkMetrics: 'TOGGLE_NETWORK_METRICS',
  LeaveMeeting: 'LEAVE_MEETING',
  GetMeetingInfo: 'GET_MEETING_INFO',
  GetSnInfo: 'GET_SN_INFO',
} as const;
export type RequestAction = (typeof RequestAction)[keyof typeof RequestAction];

export const EventAction = {
  NavigationDidMount: 'NAVIGATION_DID_MOUNT',
  TimerMenuItemStateDidUpdate: 'TIMER_MENU_ITEM_STATE_DID_UPDATE',
  RosterMenuItemStateDidUpdate: 'ROSTER_MENU_ITEM_STATE_DID_UPDATE',
  ChatMenuItemStateDidUpdate: 'CHAT_MENU_ITEM_STATE_DID_UPDATE',
} as const;
export type EventAction = (typeof EventAction)[keyof typeof EventAction];

// API List
type Method = (...args: any[]) => any;
type ExtractMethods<T> = {
  [K in keyof T]: T[K] extends Method ? T[K] : never;
};
export type VCRApiList = ExtractMethods<typeof VCRServiceAPI.prototype>;

// etc
export interface MeetingInfo {
  meetingId: string;
  localUserName: string;
}
export interface SnInfo {
  acadSn: string;
  courSn: string;
  classSn: string;
}
