import { motion } from 'framer-motion';
import { InventoryGrid } from '../components/inventory/InventoryGrid';

export function InventoryPage() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="p-6"
    >
      <InventoryGrid />
    </motion.div>
  );
}
