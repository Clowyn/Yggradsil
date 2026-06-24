import { motion } from 'framer-motion';
import { GameMap } from '../components/map/GameMap';

export function MapPage() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="h-[calc(100vh-60px)]"
    >
      <GameMap />
    </motion.div>
  );
}
