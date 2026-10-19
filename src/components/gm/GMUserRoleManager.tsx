import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Crown,
  Shield,
  Users,
  Search,
  Sparkles,
  RefreshCw,
  UserCheck,
  Swords,
} from 'lucide-react';
import type { Locale, UserRole } from '../../lib/types';

export interface GMManagedUser {
  id: string;
  username: string;
  avatar_url: string | null;
  role: UserRole;
  created_at: string;
  isCampaignMember: boolean;
  characterNames: string[];
}

export interface GMUserRoleManagerProps {
  users: GMManagedUser[];
  loading?: boolean;
  currentUserId?: string | null;
  campaignGmId?: string | null;
  updatingUserId?: string | null;
  locale: Locale;
  onUpdateRole: (userId: string, newRole: 'gm' | 'player') => Promise<void> | void;
  onRefresh?: () => void;
}

export function GMUserRoleManager({
  users,
  loading = false,
  currentUserId,
  campaignGmId,
  updatingUserId,
  locale,
  onUpdateRole,
  onRefresh,
}: GMUserRoleManagerProps) {
  const isTr = locale === 'tr';
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'gm' | 'player'>('all');
  const [selectedQuickUserId, setSelectedQuickUserId] = useState('');

  const playerUsers = useMemo(
    () => users.filter((u) => u.role === 'player' && u.id !== currentUserId),
    [users, currentUserId]
  );

  const gmCount = useMemo(
    () => users.filter((u) => u.role === 'gm' || u.role === 'admin').length,
    [users]
  );

  const playerCount = useMemo(
    () => users.filter((u) => u.role === 'player').length,
    [users]
  );

  const filteredUsers = useMemo(() => {
    const q = search.trim().toLowerCase();
    return users.filter((u) => {
      if (roleFilter === 'gm' && u.role !== 'gm' && u.role !== 'admin') return false;
      if (roleFilter === 'player' && u.role !== 'player') return false;
      if (!q) return true;
      const matchesName = u.username.toLowerCase().includes(q);
      const matchesChar = u.characterNames.some((c) => c.toLowerCase().includes(q));
      return matchesName || matchesChar;
    });
  }, [users, search, roleFilter]);

  const effectiveQuickUserId = useMemo(() => {
    if (selectedQuickUserId && playerUsers.some((u) => u.id === selectedQuickUserId)) {
      return selectedQuickUserId;
    }
    return playerUsers.length === 1 ? playerUsers[0].id : '';
  }, [selectedQuickUserId, playerUsers]);

  const handleQuickPromote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!effectiveQuickUserId) return;
    await onUpdateRole(effectiveQuickUserId, 'gm');
    setSelectedQuickUserId('');
  };

  return (
    <motion.div
      data-testid="gm-user-role-manager"
      className="arcane-glass rounded-2xl border border-amber-900/35 p-4 sm:p-6 space-y-5"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-amber-900/25">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/40 flex items-center justify-center text-amber-300 shrink-0 shadow-[0_0_15px_rgba(245,158,11,0.15)]">
            <Crown className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-cinzel font-bold text-amber-100 uppercase tracking-wider flex items-center gap-2 flex-wrap">
              <span>{isTr ? 'GM Yetki & Kullanıcı Yönetimi' : 'GM Role & User Management'}</span>
              <span className="text-[10px] font-cinzel px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30">
                {gmCount} GM • {playerCount} {isTr ? 'Oyuncu' : 'Players'}
              </span>
            </h3>
            <p className="text-xs text-stone-400 font-inter mt-0.5">
              {isTr
                ? 'Diğer kullanıcıları Oyun Yöneticisi (GM) yapabilir veya mevcut GM yetkilerini yönetebilirsiniz.'
                : 'Promote other users to Game Master (GM) or manage existing user roles.'}
            </p>
          </div>
        </div>

        {onRefresh && (
          <button
            type="button"
            onClick={onRefresh}
            disabled={loading}
            className="self-start sm:self-auto flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-amber-500/15 border border-amber-900/40 hover:border-amber-500/40 text-xs font-cinzel font-bold text-amber-200 transition-all cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>{isTr ? 'Yenile' : 'Refresh'}</span>
          </button>
        )}
      </div>

      {/* Quick Promote Form */}
      <form
        data-testid="gm-quick-promote-panel"
        onSubmit={handleQuickPromote}
        className="p-3.5 sm:p-4 rounded-xl bg-amber-950/20 border border-amber-500/25 flex flex-col sm:flex-row sm:items-center gap-3"
      >
        <div className="flex items-center gap-2 text-xs font-cinzel font-bold text-amber-200 shrink-0">
          <UserCheck className="w-4 h-4 text-amber-400 shrink-0" />
          <span>{isTr ? 'Hızlı GM Yetkisi Ver:' : 'Quick Promote to GM:'}</span>
        </div>

        <select
          data-testid="gm-promote-user-select"
          value={effectiveQuickUserId}
          onChange={(e) => setSelectedQuickUserId(e.target.value)}
          disabled={playerUsers.length === 0 || Boolean(updatingUserId)}
          className="flex-1 bg-[#12151f] border border-amber-900/40 rounded-xl px-3 py-2 text-xs sm:text-sm text-amber-100 font-inter focus:outline-none focus:border-amber-500/60 disabled:opacity-50 cursor-pointer"
        >
          {playerUsers.length === 0 ? (
            <option value="">
              {isTr ? 'Terfi ettirilecek oyuncu bulunmuyor' : 'No player accounts available to promote'}
            </option>
          ) : (
            <>
              <option value="">
                {isTr ? 'Bir kullanıcı seçin...' : 'Select a user to make GM...'}
              </option>
              {playerUsers.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.username}
                  {u.characterNames.length > 0 ? ` (${u.characterNames.join(', ')})` : ''}
                </option>
              ))}
            </>
          )}
        </select>

        <button
          type="submit"
          data-testid="gm-quick-promote-btn"
          disabled={!effectiveQuickUserId || Boolean(updatingUserId)}
          className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-amber-500/25 hover:bg-amber-500/35 border border-amber-500/50 text-amber-200 text-xs font-cinzel font-bold uppercase tracking-wider shadow-[0_0_15px_rgba(245,158,11,0.2)] transition-all cursor-pointer disabled:opacity-40 disabled:pointer-events-none shrink-0"
        >
          <Crown className="w-3.5 h-3.5 text-amber-300" />
          <span>{isTr ? 'GM Yap' : 'Make GM'}</span>
        </button>
      </form>

      {/* Search & Filter Controls */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            data-testid="gm-user-search-input"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={
              isTr ? 'Kullanıcı adı veya karakter ara...' : 'Search by username or character...'
            }
            className="w-full bg-black/40 border border-amber-900/30 rounded-xl pl-9 pr-3 py-2 text-xs sm:text-sm text-amber-100 placeholder-stone-500 font-inter focus:outline-none focus:border-amber-500/50"
          />
        </div>

        <div className="flex items-center gap-1.5">
          {(
            [
              { key: 'all', label: isTr ? 'Tümü' : 'All', count: users.length },
              { key: 'gm', label: 'GM', count: gmCount },
              { key: 'player', label: isTr ? 'Oyuncular' : 'Players', count: playerCount },
            ] as const
          ).map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => setRoleFilter(f.key)}
              className={`px-3 py-1.5 rounded-xl text-xs font-cinzel font-bold transition-all cursor-pointer ${
                roleFilter === f.key
                  ? 'bg-amber-500/20 text-amber-200 border border-amber-500/40'
                  : 'bg-black/30 text-stone-400 border border-white/5 hover:text-amber-200'
              }`}
            >
              {f.label} ({f.count})
            </button>
          ))}
        </div>
      </div>

      {/* User Rows */}
      <div data-testid="gm-user-list" className="space-y-2.5">
        {loading && users.length === 0 ? (
          <div className="text-center py-8 text-xs font-cinzel text-amber-300/70 uppercase tracking-widest animate-pulse">
            {isTr ? 'Kullanıcılar yükleniyor...' : 'Loading users...'}
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="text-center py-8 text-xs text-stone-500 font-inter">
            <Users className="w-8 h-8 mx-auto mb-2 opacity-30" />
            {isTr ? 'Eşleşen kullanıcı bulunamadı.' : 'No matching users found.'}
          </div>
        ) : (
          filteredUsers.map((u) => {
            const isSelf = u.id === currentUserId;
            const isCampaignOwner = Boolean(campaignGmId && u.id === campaignGmId);
            const isAdminUser = u.role === 'admin';
            const isUpdating = updatingUserId === u.id;
            const isProtected = isSelf || isAdminUser || isCampaignOwner;

            return (
              <div
                key={u.id}
                data-testid={`gm-user-row-${u.id}`}
                className={`p-3.5 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                  u.role === 'gm' || u.role === 'admin'
                    ? 'bg-amber-950/15 border-amber-500/30'
                    : 'bg-black/40 border-white/10 hover:border-amber-900/40'
                }`}
              >
                {/* User Identity */}
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center font-cinzel font-bold text-sm border shrink-0 overflow-hidden ${
                      u.role === 'gm' || u.role === 'admin'
                        ? 'bg-amber-500/20 border-amber-500/50 text-amber-200'
                        : 'bg-stone-900 border-stone-700 text-stone-300'
                    }`}
                  >
                    {u.avatar_url ? (
                      <img
                        src={u.avatar_url}
                        alt={u.username}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      (u.username?.[0] || 'U').toUpperCase()
                    )}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-cinzel font-bold text-amber-100 truncate">
                        {u.username}
                      </span>

                      {isSelf && (
                        <span className="text-[10px] font-cinzel font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30">
                          {isTr ? 'Siz' : 'You'}
                        </span>
                      )}

                      {isCampaignOwner && (
                        <span className="text-[10px] font-cinzel font-bold px-2 py-0.5 rounded-full bg-rose-950/60 text-rose-300 border border-rose-500/30">
                          {isTr ? 'Sefer Kurucusu' : 'Campaign Host'}
                        </span>
                      )}

                      {/* Role Badge */}
                      <span
                        data-testid={`gm-user-role-badge-${u.id}`}
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-cinzel font-bold ${
                          u.role === 'admin'
                            ? 'bg-red-950/80 text-red-300 border border-red-500/40'
                            : u.role === 'gm'
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                              : 'bg-stone-800/80 text-stone-300 border border-stone-700'
                        }`}
                      >
                        {u.role === 'admin' ? (
                          <>
                            <Sparkles size={11} className="text-red-400" />
                            <span>Admin</span>
                          </>
                        ) : u.role === 'gm' ? (
                          <>
                            <Crown size={11} className="text-amber-400" />
                            <span>Game Master (GM)</span>
                          </>
                        ) : (
                          <>
                            <Swords size={11} className="text-stone-400" />
                            <span>{isTr ? 'Oyuncu' : 'Player'}</span>
                          </>
                        )}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-[11px] text-stone-400 font-inter mt-0.5 flex-wrap">
                      {u.characterNames.length > 0 ? (
                        <span>
                          {isTr ? 'Karakterler:' : 'Characters:'}{' '}
                          <strong className="text-amber-200/80">
                            {u.characterNames.join(', ')}
                          </strong>
                        </span>
                      ) : (
                        <span className="text-stone-500">
                          {isTr ? 'Henüz karakter yok' : 'No characters created yet'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Role Action Controls */}
                <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                  {isAdminUser ? (
                    <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-cinzel font-bold bg-red-950/40 text-red-300 border border-red-500/30">
                      <Shield size={13} />
                      <span>{isTr ? 'Sistem Yöneticisi' : 'System Admin'}</span>
                    </span>
                  ) : (
                    <>
                      {/* Role Selector Dropdown */}
                      <select
                        data-testid={`gm-role-select-${u.id}`}
                        aria-label={`${u.username} role`}
                        value={u.role === 'gm' ? 'gm' : 'player'}
                        disabled={isProtected || isUpdating}
                        onChange={(e) =>
                          onUpdateRole(u.id, e.target.value as 'gm' | 'player')
                        }
                        className="bg-[#12151f] border border-amber-900/40 rounded-xl px-2.5 py-1.5 text-xs text-amber-100 font-inter focus:outline-none focus:border-amber-500/50 cursor-pointer disabled:opacity-40"
                      >
                        <option value="player">
                          ⚔️ {isTr ? 'Oyuncu (Player)' : 'Player'}
                        </option>
                        <option value="gm">⚜️ Game Master (GM)</option>
                      </select>

                      {/* Direct One-Click Promote / Demote Button */}
                      {u.role === 'player' ? (
                        <button
                          type="button"
                          data-testid={`gm-promote-btn-${u.id}`}
                          disabled={isProtected || isUpdating}
                          onClick={() => onUpdateRole(u.id, 'gm')}
                          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/35 border border-amber-500/40 text-amber-200 text-xs font-cinzel font-bold uppercase tracking-wider shadow-[0_0_12px_rgba(245,158,11,0.15)] transition-all cursor-pointer disabled:opacity-40 disabled:pointer-events-none"
                        >
                          <Crown size={13} className="text-amber-300" />
                          <span>
                            {isUpdating
                              ? isTr
                                ? 'Güncelleniyor...'
                                : 'Updating...'
                              : isTr
                                ? 'GM Yap'
                                : 'Make GM'}
                          </span>
                        </button>
                      ) : !isProtected ? (
                        <button
                          type="button"
                          data-testid={`gm-demote-btn-${u.id}`}
                          disabled={isUpdating}
                          onClick={() => onUpdateRole(u.id, 'player')}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-rose-950/40 border border-white/10 hover:border-rose-500/30 text-stone-300 hover:text-rose-300 text-xs font-cinzel font-bold transition-all cursor-pointer disabled:opacity-40"
                        >
                          <span>
                            {isUpdating
                              ? isTr
                                ? 'Güncelleniyor...'
                                : 'Updating...'
                              : isTr
                                ? 'Oyuncu Yap'
                                : 'Set as Player'}
                          </span>
                        </button>
                      ) : null}
                    </>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </motion.div>
  );
}
