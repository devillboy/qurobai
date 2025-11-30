import { motion } from "framer-motion";

const orbs = [
  { size: 400, x: "15%", y: "20%", color: "hsl(175 80% 50% / 0.15)", delay: 0, duration: 8 },
  { size: 300, x: "80%", y: "30%", color: "hsl(280 70% 60% / 0.12)", delay: 2, duration: 10 },
  { size: 500, x: "60%", y: "70%", color: "hsl(200 80% 50% / 0.1)", delay: 4, duration: 12 },
  { size: 250, x: "25%", y: "75%", color: "hsl(320 70% 50% / 0.08)", delay: 1, duration: 9 },
  { size: 350, x: "90%", y: "80%", color: "hsl(175 80% 50% / 0.1)", delay: 3, duration: 11 },
];

export const AnimatedBackground = () => {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none">
      {/* Grid overlay */}
      <div className="absolute inset-0 bg-grid-pattern bg-grid opacity-30" />
      
      {/* Animated orbs */}
      {orbs.map((orb, index) => (
        <motion.div
          key={index}
          className="absolute rounded-full"
          style={{
            width: orb.size,
            height: orb.size,
            left: orb.x,
            top: orb.y,
            background: `radial-gradient(circle, ${orb.color} 0%, transparent 70%)`,
            filter: "blur(60px)",
          }}
          animate={{
            x: [0, 30, -20, 0],
            y: [0, -40, 20, 0],
            scale: [1, 1.1, 0.95, 1],
          }}
          transition={{
            duration: orb.duration,
            delay: orb.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}

      {/* Central glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-gradient-radial from-primary/5 via-transparent to-transparent opacity-50" />
      
      {/* Vignette */}
      <div className="absolute inset-0 bg-gradient-radial from-transparent via-transparent to-background/80" />
    </div>
  );
};
