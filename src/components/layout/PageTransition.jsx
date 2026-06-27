import { motion } from 'framer-motion';

const pageVariants = {
  initial: {
    opacity: 0,
    y: 10,
    scale: 0.98,
  },
  in: {
    opacity: 1,
    y: 0,
    scale: 1,
  },
  out: {
    opacity: 0,
    y: -10,
    scale: 0.98,
  },
};

const pageTransition = {
  type: 'tween',
  ease: [0.16, 1, 0.3, 1], // iOS-like cubic-bezier
  duration: 0.4,
};

export default function PageTransition({ children, className = '' }) {
  return (
    <motion.div
      initial="initial"
      animate="in"
      exit="out"
      variants={pageVariants}
      transition={pageTransition}
      className={`h-full w-full ${className}`}
    >
      {children}
    </motion.div>
  );
}
