import { motion } from 'framer-motion';
import { SpellTreeGraph } from '../components/spell-tree/SpellTreeGraph';

export function SpellTreePage() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="h-[calc(100vh-60px)] p-6"
    >
      <SpellTreeGraph />
    </motion.div>
  );
}
