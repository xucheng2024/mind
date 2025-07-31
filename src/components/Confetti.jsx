import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const Confetti = ({ 
  isActive = false, 
  duration = 3000,
  className = '' 
}) => {
  const [particles, setParticles] = useState([]);

  useEffect(() => {
    if (isActive) {
      // Generate random particles
      const newParticles = Array.from({ length: 50 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: -10,
        rotation: Math.random() * 360,
        scale: Math.random() * 0.5 + 0.5,
        color: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD'][Math.floor(Math.random() * 6)]
      }));
      
      setParticles(newParticles);

      // Clear particles after duration
      const timer = setTimeout(() => {
        setParticles([]);
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [isActive, duration]);

  return (
    <div className={`fixed inset-0 pointer-events-none z-50 ${className}`}>
      <AnimatePresence>
        {isActive && particles.map((particle) => (
          <motion.div
            key={particle.id}
            className="absolute w-2 h-2 rounded-full"
            style={{
              left: `${particle.x}%`,
              backgroundColor: particle.color,
            }}
            initial={{
              y: particle.y,
              x: particle.x,
              rotation: particle.rotation,
              scale: particle.scale,
              opacity: 1
            }}
            animate={{
              y: '100vh',
              x: particle.x + (Math.random() - 0.5) * 20,
              rotation: particle.rotation + 360,
              scale: [particle.scale, particle.scale * 1.2, particle.scale * 0.8],
              opacity: [1, 1, 0]
            }}
            transition={{
              duration: 3,
              ease: 'easeOut',
              delay: Math.random() * 0.5
            }}
            exit={{ opacity: 0 }}
          />
        ))}
      </AnimatePresence>
    </div>
  );
};

export default Confetti; 