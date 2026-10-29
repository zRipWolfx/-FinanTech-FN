export const easeOut = [0.23, 1, 0.32, 1] as const;

export const fadeUp = {
  initial: { opacity: 0, transform: "translateY(16px) scale(0.98)" },
  animate: { opacity: 1, transform: "translateY(0px) scale(1)" },
  exit: { opacity: 0, transform: "translateY(10px) scale(0.98)" },
};

export const panelTransition = {
  duration: 0.35,
  ease: easeOut,
};
