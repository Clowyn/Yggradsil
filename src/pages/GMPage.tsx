import { motion } from 'framer-motion';
import { GMDashboard } from '../components/gm/GMDashboard';

export function GMPage() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="w-full flex justify-center pb-12"
    >
      <GMDashboard />
    </motion.div>
  );
}
