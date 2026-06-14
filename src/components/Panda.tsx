import { motion } from "motion/react";
import { PetState } from "../types";

interface PandaProps {
  state?: PetState;
  size?: number;
}

export function Panda({ state = "idle", size = 120 }: PandaProps) {
  // Map states to panda image names
  const getPandaImage = () => {
    const baseUrl = '/assets/pandas';
    switch (state) {
      case "jump":
        return `${baseUrl}/happy.jpg`;
      case "dance":
        return `${baseUrl}/music.jpg`;
      case "sleep":
        return `${baseUrl}/meditate.jpg`;
      case "sad":
        return `${baseUrl}/confused.jpg`;
      case "learn":
      case "learning":
        return `${baseUrl}/laptop.jpg`;
      case "idle":
      default:
        return `${baseUrl}/smile.jpg`;
    }
  };

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
      style={{ 
        width: size, 
        height: size, 
        position: "relative", 
        display: "flex", 
        alignItems: "center", 
        justifyContent: "center",
        borderRadius: "50%",
        overflow: "hidden"
      }}
    >
      <img 
        src={getPandaImage()} 
        alt={`Panda ${state}`}
        style={{ 
          width: "100%", 
          height: "100%", 
          objectFit: 'cover',
          borderRadius: "50%"
        }}
      />
    </motion.div>
  );
}
