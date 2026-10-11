import { motion } from 'framer-motion';
import { InventoryGrid } from '../components/inventory/InventoryGrid';

export function InventoryPage() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="w-full flex justify-center pb-8"
    >
      <InventoryGrid />
    </motion.div>
  );
}
