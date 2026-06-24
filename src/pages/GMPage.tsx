import { motion } from 'framer-motion';
import { GMDashboard } from '../components/gm/GMDashboard';

export function GMPage() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="p-6"
    >
      <GMDashboard />
    </motion.div>
  );
}
