import { motion } from "motion/react";
import { PetState } from "../types";

interface PandaProps {
  state?: PetState;
  size?: number;
}

export function Panda({ state = "idle", size = 120 }: PandaProps) {
  const getVariants = () => {
    switch (state) {
      case "jump":
        return { y: [0, -30, 0], transition: { repeat: Infinity, duration: 0.6 } };
      case "dance":
        return { 
          rotate: [-5, 5, -5], 
          x: [-5, 5, -5],
          transition: { repeat: Infinity, duration: 0.5 } 
        };
      case "sleep":
        return { scale: [1, 1.02, 1], transition: { repeat: Infinity, duration: 3 } };
      case "sad":
        return { y: [0, 2, 0], transition: { repeat: Infinity, duration: 2 } };
      default:
        return { y: [0, -5, 0], transition: { repeat: Infinity, duration: 2.5 } };
    }
  };

  return (
    <motion.div 
      animate={getVariants()}
      style={{ width: size, height: size, position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}
    >
      <svg width={size} height={size} viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Glow Aura */}
        <circle cx="60" cy="65" r="45" fill={state === "sad" ? "#60A5FA" : "#FBBF24"} opacity="0.15" />
        
        {/* Ears */}
        <circle cx="35" cy="35" r="14" fill="#1A1A1A" />
        <circle cx="85" cy="35" r="14" fill="#1A1A1A" />
        
        {/* Body */}
        <ellipse cx="60" cy="85" rx="35" ry="25" fill="white" stroke="#1A1A1A" strokeWidth="2" />
        
        {/* Head */}
        <circle cx="60" cy="55" r="32" fill="white" stroke="#1A1A1A" strokeWidth="2" />
        
        {/* Eye Patches */}
        <ellipse cx="48" cy="52" rx="9" ry="11" fill="#1A1A1A" transform="rotate(-10 48 52)" />
        <ellipse cx="72" cy="52" rx="9" ry="11" fill="#1A1A1A" transform="rotate(10 72 52)" />
        
        {/* Eyes */}
        {state === "sleep" ? (
          <>
            <path d="M44 52 Q48 48 52 52" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
            <path d="M68 52 Q72 48 76 52" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
          </>
        ) : state === "sad" ? (
          <>
            <path d="M44 52 Q48 56 52 52" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
            <path d="M68 52 Q72 56 76 52" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
          </>
        ) : (
          <>
            <circle cx="48" cy="52" r="3" fill="white" />
            <circle cx="72" cy="52" r="3" fill="white" />
          </>
        )}

        {/* Blush */}
        {(state === "smile" || state === "jump" || state === "dance") && (
          <>
            <circle cx="40" cy="62" r="4" fill="#FFB3DE" opacity="0.6" />
            <circle cx="80" cy="62" r="4" fill="#FFB3DE" opacity="0.6" />
          </>
        )}

        {/* Nose */}
        <path d="M57 60 Q60 63 63 60" stroke="#1A1A1A" strokeWidth="2" strokeLinecap="round" />
        
        {/* Mouth */}
        {state === "smile" || state === "jump" || state === "dance" ? (
          <path d="M54 66 Q60 72 66 66" stroke="#1A1A1A" strokeWidth="2" strokeLinecap="round" fill="none" />
        ) : state === "sad" ? (
          <path d="M54 68 Q60 62 66 68" stroke="#1A1A1A" strokeWidth="2" strokeLinecap="round" fill="none" />
        ) : (
          <path d="M56 66 Q60 68 64 66" stroke="#1A1A1A" strokeWidth="1.5" strokeLinecap="round" fill="none" />
        )}

        {/* Decorations */}
        {state === "sleep" && (
          <motion.text 
            x="85" y="30" fontSize="10" fill="#7C3AED" fontWeight="bold"
            animate={{ opacity: [0, 1, 0], y: [0, -10], x: [0, 5] }}
            transition={{ repeat: Infinity, duration: 2 }}
          >Zzz</motion.text>
        )}
        {(state === "jump" || state === "dance") && (
          <>
            <motion.text x="15" y="25" fontSize="12" animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity }}>✨</motion.text>
            <motion.text x="95" y="20" fontSize="12" animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, delay: 0.2 }}>🌟</motion.text>
          </>
        )}
      </svg>
    </motion.div>
  );
}
