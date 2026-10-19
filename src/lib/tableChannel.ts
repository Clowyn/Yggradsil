import { supabase } from './supabase';
import type {
  CampaignMessage,
  CampaignMessageDiceData,
  TableMessageType,
} from './types';

export interface TableChannelState {
  isOpen: boolean;
  messages: CampaignMessage[];
  unreadCount: number;
  activeFilter: 'all' | 'chat' | 'roll' | 'whisper';
}

type TableChannelListener = (state: TableChannelState) => void;

const STORAGE_KEY = 'dnd_table_messages_v1';

const INITIAL_DEMO_MESSAGES: CampaignMessage[] = [
  {
    id: 'msg-welcome-1',
    campaign_id: 'local',
    sender_id: 'system',
    sender_name: 'Yggdrasil Chronicle',
    sender_role: 'gm',
    recipient_id: null,
    recipient_name: null,
    message_type: 'system',
    content: 'Kadim Masa Kanalı aktif. Zar atışları, masa sohbeti ve GM gizli fısıltıları gerçek zamanlı kaydedilir.',
    dice_data: null,
    created_at: new Date(Date.now() - 120000).toISOString(),
  },
];

function loadInitialMessages(): CampaignMessage[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch {
    // ignore
  }
  return INITIAL_DEMO_MESSAGES;
}

function persistMessages(messages: CampaignMessage[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(messages.slice(-100)));
  } catch {
    // ignore
  }
}

let channelState: TableChannelState = {
  isOpen: false,
  messages: loadInitialMessages(),
  unreadCount: 0,
  activeFilter: 'all',
};

// Context metadata updated by TableChatDrawer so automatic dice rolls know who rolled
let activeSenderContext: {
  campaignId: string;
  userId: string | null;
  senderName: string;
  senderRole: 'player' | 'gm' | 'admin';
} = {
  campaignId: 'local',
  userId: null,
  senderName: 'Adventurer',
  senderRole: 'player',
};

const listeners = new Set<TableChannelListener>();

function notifyListeners() {
  const snapshot: TableChannelState = {
    ...channelState,
    messages: [...channelState.messages],
  };
  listeners.forEach((l) => l(snapshot));
}

export function getTableChannelState(): TableChannelState {
  return {
    ...channelState,
    messages: [...channelState.messages],
  };
}

export function subscribeToTableChannel(listener: TableChannelListener): () => void {
  listeners.add(listener);
  listener({ ...channelState, messages: [...channelState.messages] });
  return () => {
    listeners.delete(listener);
  };
}

export function setTableSenderContext(ctx: {
  campaignId?: string;
  userId?: string | null;
  senderName?: string;
  senderRole?: 'player' | 'gm' | 'admin';
}) {
  activeSenderContext = {
    campaignId: ctx.campaignId || activeSenderContext.campaignId,
    userId: ctx.userId !== undefined ? ctx.userId : activeSenderContext.userId,
    senderName: ctx.senderName || activeSenderContext.senderName,
    senderRole: ctx.senderRole || activeSenderContext.senderRole,
  };
}

export function openTableChat() {
  channelState = { ...channelState, isOpen: true, unreadCount: 0 };
  notifyListeners();
}

export function closeTableChat() {
  channelState = { ...channelState, isOpen: false };
  notifyListeners();
}

export function toggleTableChat() {
  const nextOpen = !channelState.isOpen;
  channelState = {
    ...channelState,
    isOpen: nextOpen,
    unreadCount: nextOpen ? 0 : channelState.unreadCount,
  };
  notifyListeners();
}

export function setTableChatFilter(filter: 'all' | 'chat' | 'roll' | 'whisper') {
  channelState = { ...channelState, activeFilter: filter };
  notifyListeners();
}

export function clearTableMessages() {
  channelState = { ...channelState, messages: [], unreadCount: 0 };
  persistMessages([]);
  notifyListeners();
}

/**
 * Pure privacy & visibility filter for Table Chat messages:
 * - GMs/Admins can see all messages (including secret rolls and whispers).
 * - Secret rolls ('secret_roll') are only visible to GMs/Admins or the sender.
 * - Whispers ('whisper') are only visible to GMs/Admins, the sender, or the targeted recipient.
 */
export function canUserViewMessage(
  msg: CampaignMessage,
  viewer: {
    userId?: string | null;
    characterId?: string | null;
    characterName?: string | null;
    username?: string | null;
    isGM?: boolean;
  }
): boolean {
  if (viewer.isGM) return true;

  if (msg.message_type === 'secret_roll' || msg.is_secret_roll) {
    return Boolean(viewer.userId && msg.sender_id === viewer.userId);
  }

  if (msg.message_type === 'whisper' || msg.is_whisper) {
    if (viewer.userId && (msg.sender_id === viewer.userId || msg.recipient_id === viewer.userId)) {
      return true;
    }
    if (viewer.characterId && msg.recipient_id === viewer.characterId) {
      return true;
    }
    if (msg.recipient_name) {
      const target = msg.recipient_name.trim().toLowerCase();
      if (viewer.characterName && viewer.characterName.trim().toLowerCase() === target) {
        return true;
      }
      if (viewer.username && viewer.username.trim().toLowerCase() === target) {
        return true;
      }
    }
    return false;
  }

  return true;
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isValidUuid(val: string | null | undefined): val is string {
  return typeof val === 'string' && UUID_REGEX.test(val.trim());
}

function generateMessageId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function ingestRealtimeTableMessage(incoming: CampaignMessage) {
  const incomingTime = new Date(incoming.created_at).getTime();
  const exists = channelState.messages.some((m) => {
    if (m.id === incoming.id) return true;
    const mTime = new Date(m.created_at).getTime();
    return (
      m.content === incoming.content &&
      m.sender_name === incoming.sender_name &&
      m.message_type === incoming.message_type &&
      Math.abs(incomingTime - mTime) < 2500
    );
  });
  if (exists) return;

  const nextMessages = [...channelState.messages, incoming].slice(-100);
  channelState = {
    ...channelState,
    messages: nextMessages,
    unreadCount: channelState.isOpen ? 0 : channelState.unreadCount + 1,
  };
  persistMessages(nextMessages);
  notifyListeners();
}

export async function sendTableMessage(params: {
  content: string;
  messageType?: TableMessageType;
  recipientId?: string | null;
  recipientName?: string | null;
  diceData?: CampaignMessageDiceData | null;
  senderName?: string;
  senderRole?: 'player' | 'gm' | 'admin';
  senderId?: string | null;
  campaignId?: string;
}): Promise<CampaignMessage> {
  const campaignId = params.campaignId || activeSenderContext.campaignId || 'local';
  const senderId = params.senderId !== undefined ? params.senderId : activeSenderContext.userId;
  const senderName = params.senderName || activeSenderContext.senderName || 'Adventurer';
  const senderRole = params.senderRole || activeSenderContext.senderRole || 'player';
  const messageType: TableMessageType = params.messageType || 'chat';
  const isWhisper = messageType === 'whisper';
  const isSecretRoll = messageType === 'secret_roll';

  const localMsg: CampaignMessage = {
    id: generateMessageId(),
    campaign_id: campaignId,
    sender_id: senderId,
    sender_name: senderName,
    sender_role: senderRole,
    recipient_id: params.recipientId || null,
    recipient_name: params.recipientName || null,
    message_type: messageType,
    content: params.content,
    dice_data: params.diceData || null,
    is_whisper: isWhisper,
    is_secret_roll: isSecretRoll,
    created_at: new Date().toISOString(),
  };

  const nextMessages = [...channelState.messages, localMsg].slice(-100);
  channelState = {
    ...channelState,
    messages: nextMessages,
    unreadCount: channelState.isOpen ? 0 : channelState.unreadCount + 1,
  };
  persistMessages(nextMessages);
  notifyListeners();

  if (campaignId && campaignId !== 'local' && !campaignId.startsWith('demo-') && isValidUuid(campaignId)) {
    try {
      await supabase.from('campaign_messages').insert({
        id: localMsg.id,
        campaign_id: campaignId,
        sender_id: isValidUuid(senderId) ? senderId : null,
        sender_name: senderName,
        sender_role: senderRole,
        recipient_id: isValidUuid(params.recipientId) ? params.recipientId : null,
        recipient_name: params.recipientName || null,
        message_type: messageType,
        content: params.content,
        dice_data: params.diceData || null,
        is_whisper: isWhisper,
        is_secret_roll: isSecretRoll,
      });
    } catch {
      // Offline / local fallback already applied
    }
  }

  return localMsg;
}

export function broadcastDiceRollToTable(
  diceData: CampaignMessageDiceData,
  options?: {
    isSecret?: boolean;
    senderName?: string;
  }
) {
  const isSecret = Boolean(options?.isSecret);
  const modStr =
    diceData.modifier > 0
      ? `+${diceData.modifier}`
      : diceData.modifier < 0
      ? `${diceData.modifier}`
      : '';
  const formula = `${diceData.count}${diceData.dieType}${modStr}`;

  const summaryText = `${diceData.label} (${formula}) → ${diceData.total}${
    diceData.isCrit ? ' [NATURAL 20!]' : diceData.isFumble ? ' [NATURAL 1!]' : ''
  }`;

  void sendTableMessage({
    content: summaryText,
    messageType: isSecret ? 'secret_roll' : 'roll',
    diceData,
    senderName: options?.senderName,
  });
}
