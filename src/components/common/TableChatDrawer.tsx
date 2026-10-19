import { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageSquare,
  X,
  Send,
  Dices,
  Lock,
  EyeOff,
  Sparkles,
  Skull,
  Trash2,
  Crown,
  User,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useCampaign } from '../../contexts/CampaignContext';
import { supabase } from '../../lib/supabase';
import { playSound } from '../../lib/audio';
import { triggerDiceRoll } from '../../lib/diceRoller';
import {
  subscribeToTableChannel,
  closeTableChat,
  sendTableMessage,
  setTableChatFilter,
  clearTableMessages,
  canUserViewMessage,
  ingestRealtimeTableMessage,
  setTableSenderContext,
  type TableChannelState,
} from '../../lib/tableChannel';
import type { CampaignMessage } from '../../lib/types';

export function TableChatDrawer() {
  const { user, profile, isGM, isAdmin, locale } = useAuth();
  const { campaign, characters, activeCharacterId } = useCampaign();
  const isTr = locale === 'tr';

  const activeCharacter = useMemo(
    () => characters.find((c) => c.id === activeCharacterId) || characters[0] || null,
    [characters, activeCharacterId]
  );

  const [state, setState] = useState<TableChannelState>({
    isOpen: false,
    messages: [],
    unreadCount: 0,
    activeFilter: 'all',
  });

  const [inputContent, setInputContent] = useState('');
  const [composeMode, setComposeMode] = useState<'chat' | 'whisper'>('chat');
  const [whisperTarget, setWhisperTarget] = useState<string>('GM');
  const scrollRef = useRef<HTMLDivElement>(null);

  const senderName = isGM
    ? profile?.username
      ? `${profile.username} (GM)`
      : 'Loremaster (GM)'
    : activeCharacter?.name || profile?.username || 'Adventurer';

  const senderRole: 'player' | 'gm' | 'admin' = isAdmin ? 'admin' : isGM ? 'gm' : 'player';

  // Keep global sender context synced for automatic dice roll broadcasts
  useEffect(() => {
    setTableSenderContext({
      campaignId: campaign?.id || 'local',
      userId: user?.id || null,
      senderName,
      senderRole,
    });
  }, [campaign?.id, user?.id, senderName, senderRole]);

  // Subscribe to local TableChannel store
  useEffect(() => {
    return subscribeToTableChannel(setState);
  }, []);

  // Subscribe to Supabase Realtime campaign_messages
  useEffect(() => {
    const campaignId = campaign?.id;
    if (!campaignId || campaignId === 'local' || campaignId.startsWith('demo-')) return;

    // Initial fetch of recent campaign messages
    void (async () => {
      try {
        const { data, error } = await supabase
          .from('campaign_messages')
          .select('*')
          .eq('campaign_id', campaignId)
          .order('created_at', { ascending: true })
          .limit(60);

        if (!error && data) {
          (data as CampaignMessage[]).forEach((msg) => ingestRealtimeTableMessage(msg));
        }
      } catch {
        // Ignore if table not yet migrated
      }
    })();

    const channel = supabase
      .channel(`campaign-messages-${campaignId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'campaign_messages',
          filter: `campaign_id=eq.${campaignId}`,
        },
        (payload) => {
          if (payload.new) {
            ingestRealtimeTableMessage(payload.new as CampaignMessage);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [campaign?.id]);

  // Filter messages by viewer permissions and active tab filter
  const visibleMessages = useMemo(() => {
    const viewer = {
      userId: user?.id || null,
      characterId: activeCharacter?.id || null,
      characterName: activeCharacter?.name || null,
      username: profile?.username || null,
      isGM,
    };

    return state.messages.filter((msg) => {
      if (!canUserViewMessage(msg, viewer)) return false;
      if (state.activeFilter === 'all') return true;
      if (state.activeFilter === 'chat') return msg.message_type === 'chat' || msg.message_type === 'system';
      if (state.activeFilter === 'roll') return msg.message_type === 'roll' || msg.message_type === 'secret_roll' || msg.message_type === 'dice';
      if (state.activeFilter === 'whisper') return msg.message_type === 'whisper';
      return true;
    });
  }, [state.messages, state.activeFilter, user?.id, activeCharacter?.id, activeCharacter?.name, profile?.username, isGM]);

  // Auto-scroll to bottom when messages arrive
  useEffect(() => {
    if (state.isOpen && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [visibleMessages.length, state.isOpen]);

  // Recipient options for whispers
  const whisperOptions = useMemo(() => {
    const opts: Array<{ id: string; profileId: string | null; label: string }> = [
      {
        id: 'GM',
        profileId: campaign?.gm_id || null,
        label: isTr ? 'GM (Oyun Yöneticisi)' : 'GM (Loremaster)',
      },
    ];
    characters.forEach((c) => {
      opts.push({
        id: c.profile_id || c.id,
        profileId: c.profile_id || null,
        label: c.name,
      });
    });
    if (opts.length === 1) {
      opts.push(
        { id: 'Kael (Fighter)', profileId: null, label: 'Kael (Fighter)' },
        { id: 'Lyria (Mage)', profileId: null, label: 'Lyria (Mage)' },
        { id: 'Thorne (Rogue)', profileId: null, label: 'Thorne (Rogue)' }
      );
    }
    return opts;
  }, [characters, campaign?.gm_id, isTr]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = inputContent.trim();
    if (!trimmed) return;

    playSound('stone_tap');

    // Support slash commands: /w [Target] message or /r 1d20+4
    if (trimmed.startsWith('/r ') || trimmed.startsWith('/roll ')) {
      const formula = trimmed.replace(/^\/(r|roll)\s+/i, '').trim();
      setInputContent('');
      triggerDiceRoll({
        formula: formula || '1d20',
        label: `Chat Roll (${formula || '1d20'})`,
        characterName: senderName,
        openModal: false,
      });
      return;
    }

    if (trimmed.startsWith('/gmroll ') || trimmed.startsWith('/sr ')) {
      const formula = trimmed.replace(/^\/(gmroll|sr)\s+/i, '').trim();
      setInputContent('');
      triggerDiceRoll({
        formula: formula || '1d20',
        label: `Secret GM Roll (${formula || '1d20'})`,
        characterName: senderName,
        openModal: false,
        isSecretRoll: true,
      });
      return;
    }

    if (trimmed.startsWith('/w ') || trimmed.startsWith('/whisper ')) {
      const rest = trimmed.replace(/^\/(w|whisper)\s+/i, '').trim();
      const firstSpace = rest.indexOf(' ');
      if (firstSpace > 0) {
        const rawTarget = rest.slice(0, firstSpace).trim();
        const whisperBody = rest.slice(firstSpace + 1).trim();
        if (whisperBody) {
          const matchedOpt = whisperOptions.find(
            (o) =>
              o.id.toLowerCase() === rawTarget.toLowerCase() ||
              o.label.toLowerCase().startsWith(rawTarget.toLowerCase())
          );
          await sendTableMessage({
            content: whisperBody,
            messageType: 'whisper',
            recipientId: matchedOpt?.profileId || matchedOpt?.id || rawTarget,
            recipientName: matchedOpt?.label || rawTarget,
            senderName,
            senderRole,
            senderId: user?.id || null,
            campaignId: campaign?.id || 'local',
          });
          setInputContent('');
          return;
        }
      }
    }

    const selectedOpt = whisperOptions.find((o) => o.id === whisperTarget || o.label === whisperTarget);

    await sendTableMessage({
      content: trimmed,
      messageType: composeMode === 'whisper' ? 'whisper' : 'chat',
      recipientId: composeMode === 'whisper' ? selectedOpt?.profileId || selectedOpt?.id || whisperTarget : null,
      recipientName: composeMode === 'whisper' ? selectedOpt?.label || whisperTarget : null,
      senderName,
      senderRole,
      senderId: user?.id || null,
      campaignId: campaign?.id || 'local',
    });

    setInputContent('');
  };

  if (!state.isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm">
        <motion.aside
          initial={{ x: '100%', opacity: 0.5 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: '100%', opacity: 0 }}
          transition={{ type: 'spring', stiffness: 320, damping: 30 }}
          data-testid="table-chat-drawer"
          className="w-full max-w-md h-dvh-screen safe-bottom bg-[#0a0c12]/98 border-l border-amber-900/40 shadow-[-20px_0_50px_rgba(0,0,0,0.85)] flex flex-col font-inter text-gray-200"
        >
          {/* Drawer Header */}
          <div className="p-4 border-b border-amber-900/30 flex items-center justify-between bg-black/40">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-amber-500/15 border border-amber-500/40 text-amber-300">
                <MessageSquare size={18} />
              </div>
              <div>
                <h3 className="text-sm font-cinzel font-extrabold text-amber-100 uppercase tracking-wider">
                  {isTr ? 'MASA SOHBETİ & ZAR GÜNLÜĞÜ' : 'TABLE CHAT & LIVE DICE LOG'}
                </h3>
                <p className="text-[10px] font-cinzel text-amber-300/70 uppercase tracking-widest">
                  {isGM
                    ? isTr
                      ? 'GM Tüm Gizli Fısıltı & Zarları Görür'
                      : 'GM Omniscient Stream Active'
                    : isTr
                    ? 'Canlı Sefer İletişim Kanalı'
                    : 'Realtime Party Chronicle'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              {visibleMessages.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    playSound('paper_flip');
                    clearTableMessages();
                  }}
                  title={isTr ? 'Sohbeti Temizle' : 'Clear Stream'}
                  className="p-2 rounded-xl border border-white/10 bg-white/5 text-stone-400 hover:text-rose-300 transition-colors cursor-pointer"
                >
                  <Trash2 size={14} />
                </button>
              )}
              <button
                type="button"
                data-testid="close-table-chat-btn"
                onClick={() => {
                  playSound('lock_click');
                  closeTableChat();
                }}
                className="p-2 rounded-xl border border-amber-900/30 bg-black/40 text-stone-400 hover:text-amber-200 transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Filter Tabs & Quick Roll Bar */}
          <div className="px-4 py-2.5 border-b border-white/10 bg-black/30 space-y-2">
            <div className="grid grid-cols-4 gap-1 bg-black/50 p-1 rounded-xl border border-white/5">
              {(
                [
                  { id: 'all', labelTr: 'Tümü', labelEn: 'All' },
                  { id: 'chat', labelTr: 'Sohbet', labelEn: 'Chat' },
                  { id: 'roll', labelTr: 'Zarlar', labelEn: 'Rolls' },
                  { id: 'whisper', labelTr: 'Fısıltı', labelEn: 'Whispers' },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  data-testid={`table-chat-filter-${tab.id}`}
                  onClick={() => setTableChatFilter(tab.id)}
                  className={`py-1 rounded-lg text-[10px] font-cinzel font-bold uppercase transition-all cursor-pointer ${
                    state.activeFilter === tab.id
                      ? 'bg-amber-500/25 text-amber-200 border border-amber-500/50'
                      : 'text-stone-400 hover:text-stone-200'
                  }`}
                >
                  {isTr ? tab.labelTr : tab.labelEn}
                </button>
              ))}
            </div>

            {/* Quick Dice Stream Rollers */}
            <div className="flex items-center justify-between gap-2">
              <button
                type="button"
                data-testid="table-chat-quick-d20-btn"
                onClick={() =>
                  triggerDiceRoll({
                    dieType: 'd20',
                    count: 1,
                    modifier: 0,
                    label: isTr ? 'Hızlı d20 Atışı' : 'Quick d20 Check',
                    characterName: senderName,
                    openModal: false,
                    isSecretRoll: false,
                  })
                }
                className="flex-1 py-1.5 px-2.5 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/35 text-amber-200 text-[10px] font-cinzel font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all"
              >
                <Dices size={12} className="text-amber-400" />
                <span>{isTr ? 'Açık d20 At' : 'Roll Public d20'}</span>
              </button>

              {isGM && (
                <button
                  type="button"
                  data-testid="table-chat-secret-d20-btn"
                  onClick={() =>
                    triggerDiceRoll({
                      dieType: 'd20',
                      count: 1,
                      modifier: 0,
                      label: isTr ? 'GM Gizli Zar' : 'GM Secret Roll',
                      characterName: senderName,
                      openModal: false,
                      isSecretRoll: true,
                    })
                  }
                  className="flex-1 py-1.5 px-2.5 rounded-lg bg-purple-500/15 hover:bg-purple-500/25 border border-purple-500/40 text-purple-200 text-[10px] font-cinzel font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all"
                >
                  <EyeOff size={12} className="text-purple-400" />
                  <span>{isTr ? 'GM Gizli d20 At' : 'GM Secret d20'}</span>
                </button>
              )}
            </div>
          </div>

          {/* Messages & Dice Stream List */}
          <div
            ref={scrollRef}
            data-testid="table-chat-message-list"
            className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin"
          >
            {visibleMessages.length === 0 ? (
              <div className="h-48 flex flex-col items-center justify-center text-center text-stone-500 space-y-2">
                <MessageSquare className="w-8 h-8 opacity-40" />
                <p className="text-xs font-cinzel">
                  {isTr ? 'Henüz mesaj veya zar kaydı yok.' : 'No messages or dice rolls yet.'}
                </p>
              </div>
            ) : (
              visibleMessages.map((msg) => {
                const isWhisper = msg.message_type === 'whisper';
                const isSecretRoll = msg.message_type === 'secret_roll';
                const isRoll = msg.message_type === 'roll' || isSecretRoll;
                const timeStr = new Date(msg.created_at).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                });

                return (
                  <div
                    key={msg.id}
                    data-testid={`table-message-${msg.message_type}`}
                    className={`rounded-xl p-3 border text-xs transition-all ${
                      isSecretRoll
                        ? 'bg-purple-950/30 border-purple-500/40 shadow-[0_0_15px_rgba(168,85,247,0.12)]'
                        : isWhisper
                        ? 'bg-indigo-950/30 border-indigo-500/40'
                        : isRoll
                        ? 'bg-amber-950/20 border-amber-500/35'
                        : 'bg-white/5 border-white/10'
                    }`}
                  >
                    {/* Sender & Badges */}
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {msg.sender_role === 'gm' || msg.sender_role === 'admin' ? (
                          <Crown className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        ) : (
                          <User className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                        )}
                        <span className="font-cinzel font-bold text-amber-200 text-[11px]">
                          {msg.sender_name}
                        </span>

                        {isWhisper && (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-indigo-500/25 border border-indigo-400/40 text-indigo-200 text-[9px] font-bold uppercase">
                            <Lock className="w-2.5 h-2.5" />
                            {isTr ? 'Fısıltı' : 'Whisper'} → {msg.recipient_name || 'GM'}
                          </span>
                        )}

                        {isSecretRoll && (
                          <span
                            data-testid="secret-roll-badge"
                            className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-purple-500/25 border border-purple-400/40 text-purple-200 text-[9px] font-bold uppercase"
                          >
                            <EyeOff className="w-2.5 h-2.5" />
                            {isTr ? 'GM Gizli Zar' : 'GM Secret Roll'}
                          </span>
                        )}
                      </div>

                      <span className="text-[10px] text-stone-500 shrink-0">{timeStr}</span>
                    </div>

                    {/* Dice Roll Breakdown Card */}
                    {isRoll && msg.dice_data ? (
                      <div className="mt-1 p-2.5 rounded-lg bg-black/50 border border-white/10 flex items-center justify-between gap-3">
                        <div className="space-y-0.5">
                          <div className="font-cinzel font-bold text-amber-100 text-xs flex items-center gap-1.5">
                            <Dices className="w-3.5 h-3.5 text-amber-400" />
                            <span>{msg.dice_data.label}</span>
                          </div>
                          <div className="text-[10px] text-stone-400 font-mono">
                            {msg.dice_data.count}
                            {msg.dice_data.dieType}
                            {msg.dice_data.modifier > 0
                              ? `+${msg.dice_data.modifier}`
                              : msg.dice_data.modifier < 0
                              ? msg.dice_data.modifier
                              : ''}{' '}
                            • [{msg.dice_data.rolls.join(', ')}]
                          </div>
                          {msg.dice_data.isCrit && (
                            <span className="inline-flex items-center gap-1 text-[10px] text-amber-300 font-bold">
                              <Sparkles className="w-3 h-3" /> NATURAL 20!
                            </span>
                          )}
                          {msg.dice_data.isFumble && (
                            <span className="inline-flex items-center gap-1 text-[10px] text-rose-400 font-bold">
                              <Skull className="w-3 h-3" /> NATURAL 1!
                            </span>
                          )}
                        </div>

                        <div
                          className={`px-3 py-1.5 rounded-xl font-cinzel text-lg font-black tabular-nums border ${
                            msg.dice_data.isCrit
                              ? 'bg-amber-500/25 border-amber-400 text-amber-300'
                              : msg.dice_data.isFumble
                              ? 'bg-rose-950/60 border-rose-500 text-rose-300'
                              : 'bg-amber-950/40 border-amber-700/40 text-amber-200'
                          }`}
                        >
                          {msg.dice_data.total}
                        </div>
                      </div>
                    ) : (
                      <p className="text-gray-200 leading-relaxed break-words">{msg.content}</p>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Composer Footer */}
          <form
            onSubmit={handleSend}
            className="p-3.5 border-t border-amber-900/30 bg-black/60 space-y-2.5"
          >
            {/* Public vs Secret Whisper Mode Toggle */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1 bg-black/50 p-1 rounded-lg border border-white/10">
                <button
                  type="button"
                  data-testid="chat-mode-public"
                  onClick={() => setComposeMode('chat')}
                  className={`px-2.5 py-1 rounded text-[10px] font-cinzel font-bold uppercase cursor-pointer transition-all ${
                    composeMode === 'chat'
                      ? 'bg-amber-500/25 text-amber-200 border border-amber-500/40'
                      : 'text-stone-400 hover:text-stone-200'
                  }`}
                >
                  {isTr ? 'Masa (Herkes)' : 'Public Table'}
                </button>
                <button
                  type="button"
                  data-testid="chat-mode-whisper"
                  onClick={() => setComposeMode('whisper')}
                  className={`px-2.5 py-1 rounded text-[10px] font-cinzel font-bold uppercase flex items-center gap-1 cursor-pointer transition-all ${
                    composeMode === 'whisper'
                      ? 'bg-indigo-500/25 text-indigo-200 border border-indigo-400/50'
                      : 'text-stone-400 hover:text-stone-200'
                  }`}
                >
                  <Lock className="w-2.5 h-2.5" />
                  <span>{isTr ? 'Gizli Fısıltı' : 'Secret Whisper'}</span>
                </button>
              </div>

              {composeMode === 'whisper' && (
                <select
                  data-testid="whisper-recipient-select"
                  value={whisperTarget}
                  onChange={(e) => setWhisperTarget(e.target.value)}
                  className="bg-[#0e1017] border border-indigo-500/40 rounded-lg px-2 py-1 text-[11px] text-indigo-200 outline-none focus:border-indigo-400 max-w-[160px] truncate"
                >
                  {whisperOptions.map((opt) => (
                    <option key={opt.id} value={opt.label}>
                      → {opt.label}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                data-testid="table-chat-input"
                value={inputContent}
                onChange={(e) => setInputContent(e.target.value)}
                placeholder={
                  composeMode === 'whisper'
                    ? isTr
                      ? `${whisperTarget} kişisine gizli fısıltı gönder...`
                      : `Send secret whisper to ${whisperTarget}...`
                    : isTr
                    ? 'Masaya mesaj yaz veya /r 1d20+4 komutu gir...'
                    : 'Send table message or type /r 1d20+4...'
                }
                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-gray-200 focus:outline-none focus:border-amber-500/50"
              />
              <button
                type="submit"
                data-testid="table-chat-send-btn"
                className="px-3.5 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-200 text-xs font-cinzel font-bold flex items-center gap-1.5 cursor-pointer transition-all"
              >
                <Send size={13} />
                <span>{isTr ? 'Gönder' : 'Send'}</span>
              </button>
            </div>
          </form>
        </motion.aside>
      </div>
    </AnimatePresence>
  );
}
