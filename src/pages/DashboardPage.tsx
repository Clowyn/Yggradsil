import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  User,
  TreePine,
  Map,
  Backpack,
  Crown,
  Sparkles,
  Sword,
  Shield,
  Flame,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useCampaign } from '../contexts/CampaignContext';

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

const NAV_CARDS = [
  {
    to: '/character',
    label: 'Character',
    desc: 'Manage your hero',
    icon: <User size={24} />,
    gradient: 'from-gold/20 to-gold-dim/5',
    borderColor: 'border-gold/20 hover:border-gold/40',
  },
  {
    to: '/stat-tree',
    label: 'Stat Tree',
    desc: 'Unlock abilities',
    icon: <TreePine size={24} />,
    gradient: 'from-emerald/20 to-emerald/5',
    borderColor: 'border-emerald/20 hover:border-emerald/40',
  },
  {
    to: '/map',
    label: 'World Map',
    desc: 'Explore the realm',
    icon: <Map size={24} />,
    gradient: 'from-arcane/20 to-arcane-dim/5',
    borderColor: 'border-arcane/20 hover:border-arcane/40',
  },
  {
    to: '/inventory',
    label: 'Inventory',
    desc: 'Your treasures',
    icon: <Backpack size={24} />,
    gradient: 'from-crimson/20 to-crimson-dim/5',
    borderColor: 'border-crimson/20 hover:border-crimson/40',
  },
];

export function DashboardPage() {
  const { profile, isGM, locale } = useAuth();
  const { campaign, members, characters, activeCharacterId } = useCampaign();

  const activeCharacter = characters?.find((c) => c.id === activeCharacterId);

  const stats = activeCharacter
    ? [
        { label: 'Level', value: activeCharacter.level.toString(), icon: <Sparkles size={18} />, color: 'text-gold' },
        {
          label: 'XP',
          value: activeCharacter.xp_total.toLocaleString(locale === 'en' ? 'en-US' : 'tr-TR'),
          icon: <Flame size={18} />,
          color: 'text-gold-bright',
        },
        { label: 'Race', value: activeCharacter.race?.name || 'Unknown', icon: <Shield size={18} />, color: 'text-arcane' },
        {
          label: 'Class',
          value: activeCharacter.subclass
            ? (locale === 'en' ? activeCharacter.subclass.name_en : activeCharacter.subclass.name_tr)
            : 'Unknown',
          icon: <Sword size={18} />,
          color: 'text-crimson',
        },
      ]
    : [
        { label: 'Level', value: '-', icon: <Sparkles size={18} />, color: 'text-parchment-dim' },
        { label: 'XP', value: '-', icon: <Flame size={18} />, color: 'text-parchment-dim' },
        { label: 'Race', value: 'None', icon: <Shield size={18} />, color: 'text-parchment-dim' },
        { label: 'Class', value: 'None', icon: <Sword size={18} />, color: 'text-parchment-dim' },
      ];

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="p-6 space-y-6 max-w-5xl mx-auto"
    >
      {/* Welcome banner */}
      <motion.div variants={item} className="glass rounded-2xl p-6 relative overflow-hidden">
        {/* Background glow */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-gold/5 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2" />

        <div className="relative z-10">
          <h1 className="text-3xl font-cinzel text-gold-gradient mb-2">
            {locale === 'en' ? 'Welcome back,' : 'Tekrar hoş geldin,'}{' '}
            {profile?.username}
          </h1>
          <p className="text-parchment/60 font-inter text-sm">
            {locale === 'en'
              ? 'Your adventure awaits in'
              : 'Maceranız sizi bekliyor:'}{' '}
            <span className="text-gold/80 font-medium">{campaign?.name}</span>
          </p>

          {/* Party info */}
          <div className="flex items-center gap-4 mt-4">
            <div className="flex -space-x-2">
              {members.map((member) => (
                <div
                  key={member.id}
                  className="w-8 h-8 rounded-full bg-gradient-to-br from-shadow to-obsidian border-2 border-gold/30 flex items-center justify-center text-[10px] font-cinzel text-gold/80"
                  title={member.profile?.username}
                >
                  {member.profile?.username?.charAt(0) ?? '?'}
                </div>
              ))}
            </div>
            <span className="text-xs text-parchment-dim font-inter">
              {members.length} {locale === 'en' ? 'adventurers' : 'maceracı'}
            </span>
            {isGM && (
              <span className="text-[10px] px-2 py-0.5 rounded bg-crimson/20 text-crimson border border-crimson/30 font-semibold font-inter">
                GM
              </span>
            )}
          </div>
        </div>
      </motion.div>

      {/* Quick stats */}
      <motion.div variants={item} className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="glass rounded-xl p-4 flex items-center gap-3 group hover:bg-white/[0.08] transition-all duration-300"
          >
            <div className={`${stat.color} opacity-70 group-hover:opacity-100 transition-opacity`}>
              {stat.icon}
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-wider text-parchment-dim font-inter">
                {stat.label}
              </p>
              <p className={`text-xl font-cinzel font-bold ${stat.color}`}>
                {stat.value}
              </p>
            </div>
          </div>
        ))}
      </motion.div>

      {/* Navigation cards */}
      <motion.div variants={item}>
        <h2 className="text-lg font-cinzel text-parchment mb-4">
          {locale === 'en' ? 'Quick Actions' : 'Hızlı İşlemler'}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {NAV_CARDS.map((card) => (
            <Link key={card.to} to={card.to}>
              <motion.div
                whileHover={{ scale: 1.03, y: -4 }}
                whileTap={{ scale: 0.98 }}
                className={`glass rounded-xl p-5 border ${card.borderColor} transition-all duration-300 cursor-pointer group`}
              >
                <div
                  className={`w-12 h-12 rounded-lg bg-gradient-to-br ${card.gradient} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300`}
                >
                  <span className="text-parchment">{card.icon}</span>
                </div>
                <h3 className="font-cinzel text-parchment text-sm font-semibold">
                  {card.label}
                </h3>
                <p className="text-xs text-parchment-dim font-inter mt-1">
                  {card.desc}
                </p>
              </motion.div>
            </Link>
          ))}
        </div>
      </motion.div>

      {/* GM quick access */}
      {isGM && (
        <motion.div variants={item}>
          <Link to="/gm">
            <motion.div
              whileHover={{ scale: 1.01 }}
              className="glass rounded-xl p-5 border border-crimson/20 hover:border-crimson/40 transition-all duration-300 flex items-center gap-4 group"
            >
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-crimson/20 to-crimson-dim/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <Crown size={24} className="text-crimson" />
              </div>
              <div>
                <h3 className="font-cinzel text-parchment text-sm font-semibold">
                  {locale === 'en' ? 'GM Dashboard' : 'GM Paneli'}
                </h3>
                <p className="text-xs text-parchment-dim font-inter mt-0.5">
                  {locale === 'en'
                    ? 'Manage your campaign, players, and encounters'
                    : 'Kampanyanızı, oyuncuları ve karşılaşmaları yönetin'}
                </p>
              </div>
            </motion.div>
          </Link>
        </motion.div>
      )}
    </motion.div>
  );
}
