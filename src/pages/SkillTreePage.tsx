import { motion } from 'framer-motion';
import { YggdrasilTree } from '../components/skill-tree/YggdrasilTree';

export function SkillTreePage() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="w-full h-[calc(100vh-130px)] sm:h-[calc(100vh-140px)]"
    >
      <YggdrasilTree />
    </motion.div>
  );
}
