 import { useState, useEffect } from "react";
 import { motion, AnimatePresence } from "framer-motion";
 import qurobLogo from "@/assets/qurob-logo.png";
 
 interface SplashScreenProps {
   onComplete: () => void;
 }
 
 export const SplashScreen = ({ onComplete }: SplashScreenProps) => {
   const [progress, setProgress] = useState(0);
   const [isExiting, setIsExiting] = useState(false);
 
   useEffect(() => {
     // Animate progress bar
     const duration = 2500;
     const interval = 50;
     const steps = duration / interval;
     const increment = 100 / steps;
 
     const timer = setInterval(() => {
       setProgress((prev) => {
         const next = prev + increment;
         if (next >= 100) {
           clearInterval(timer);
           return 100;
         }
         return next;
       });
     }, interval);
 
     // Start exit animation at 2.2s
     const exitTimer = setTimeout(() => {
       setIsExiting(true);
     }, 2200);
 
     // Complete at 2.5s
     const completeTimer = setTimeout(() => {
       onComplete();
     }, 2500);
 
     return () => {
       clearInterval(timer);
       clearTimeout(exitTimer);
       clearTimeout(completeTimer);
     };
   }, [onComplete]);
 
   return (
     <AnimatePresence>
       {!isExiting && (
         <motion.div
           className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-background overflow-hidden"
           initial={{ opacity: 1 }}
           exit={{ opacity: 0 }}
           transition={{ duration: 0.3, ease: "easeOut" }}
         >
           {/* Animated gradient background */}
           <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-accent/5" />
           
           {/* Floating particles */}
           <div className="absolute inset-0 overflow-hidden pointer-events-none">
             {[...Array(20)].map((_, i) => (
               <motion.div
                 key={i}
                 className="absolute w-2 h-2 rounded-full bg-primary/20"
                 initial={{
                   x: Math.random() * (typeof window !== "undefined" ? window.innerWidth : 1000),
                   y: Math.random() * (typeof window !== "undefined" ? window.innerHeight : 800),
                   scale: Math.random() * 0.5 + 0.5,
                   opacity: 0.2,
                 }}
                 animate={{
                   y: [null, -100, 0],
                   opacity: [0.2, 0.6, 0.2],
                   rotate: [0, 180, 360],
                 }}
                 transition={{
                   duration: 3 + Math.random() * 2,
                   repeat: Infinity,
                   delay: Math.random() * 2,
                   ease: "easeInOut",
                 }}
                 style={{
                   left: `${Math.random() * 100}%`,
                   top: `${Math.random() * 100}%`,
                 }}
               />
             ))}
           </div>
 
           {/* Logo container with glow */}
           <motion.div
             className="relative z-10"
             initial={{ scale: 0.8, opacity: 0 }}
             animate={{ scale: 1, opacity: 1 }}
             transition={{ duration: 0.5, ease: "easeOut" }}
           >
             {/* Pulsing glow effect */}
             <motion.div
               className="absolute inset-0 -m-8 rounded-full bg-gradient-to-r from-primary/30 to-accent/30 blur-3xl"
               animate={{
                 scale: [1, 1.2, 1],
                 opacity: [0.3, 0.6, 0.3],
               }}
               transition={{
                 duration: 2,
                 repeat: Infinity,
                 ease: "easeInOut",
               }}
             />
             
             {/* Logo with glow animation */}
             <motion.img
               src={qurobLogo}
               alt="QurobAi Logo"
               className="w-32 h-32 md:w-40 md:h-40 rounded-2xl shadow-2xl relative z-10"
               style={{
                 filter: "drop-shadow(0 0 30px hsl(var(--primary) / 0.4))",
               }}
               animate={{
                 filter: [
                   "drop-shadow(0 0 20px hsl(200 80% 55% / 0.4))",
                   "drop-shadow(0 0 40px hsl(200 80% 55% / 0.7))",
                   "drop-shadow(0 0 20px hsl(200 80% 55% / 0.4))",
                 ],
               }}
               transition={{
                 duration: 2,
                 repeat: Infinity,
                 ease: "easeInOut",
               }}
             />
           </motion.div>
 
           {/* Text content */}
           <motion.div
             className="mt-8 text-center relative z-10"
             initial={{ y: 20, opacity: 0 }}
             animate={{ y: 0, opacity: 1 }}
             transition={{ delay: 0.3, duration: 0.5 }}
           >
             <h1 className="text-3xl md:text-4xl font-bold text-gradient mb-2">
               QurobAi
             </h1>
             <p className="text-muted-foreground text-sm md:text-base">
               Powered by Advanced AI
             </p>
           </motion.div>
 
           {/* Progress bar */}
           <motion.div
             className="mt-8 w-48 md:w-64 relative z-10"
             initial={{ opacity: 0 }}
             animate={{ opacity: 1 }}
             transition={{ delay: 0.5 }}
           >
             <div className="h-1 bg-muted rounded-full overflow-hidden">
               <motion.div
                 className="h-full bg-gradient-to-r from-primary to-accent rounded-full"
                 style={{ width: `${progress}%` }}
                 transition={{ ease: "linear" }}
               />
             </div>
             <p className="text-xs text-muted-foreground text-center mt-2">
               Loading experience...
             </p>
           </motion.div>
 
           {/* Version badge */}
           <motion.div
             className="absolute bottom-8 text-xs text-muted-foreground/50"
             initial={{ opacity: 0 }}
             animate={{ opacity: 1 }}
             transition={{ delay: 1 }}
           >
             Version 3.0 • India's Premier AI Assistant
           </motion.div>
         </motion.div>
       )}
     </AnimatePresence>
   );
 };