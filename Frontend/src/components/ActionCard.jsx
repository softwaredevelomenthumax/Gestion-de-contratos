import React from 'react';
import { Link } from 'react-router-dom';
import { motion as Motion } from 'framer-motion';

const ActionCard = ({ action, index }) => {
  const Icon = action.icon;

  const cardVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        delay: index * 0.1,
        duration: 0.5,
        ease: "easeOut"
      }
    }
  };

  return (
    <Motion.div
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      whileHover={{ scale: 1.05, zIndex: 10 }}
      transition={{ duration: 0.3 }}
    >
      <Link
        to={action.href}
        className={`group relative block overflow-hidden rounded-2xl shadow-lg text-white h-full`}
      >
        <div className={`absolute inset-0 bg-gradient-to-br ${action.color} transition-all duration-300 group-hover:opacity-90`}></div>
        
        <div className="relative flex flex-col justify-between p-6 h-full">
          <div>
            <div className="mb-4">
              <Icon className="h-10 w-10 text-white opacity-80" />
            </div>
            <h3 className="text-2xl font-bold">
              {action.name}
            </h3>
            <p className="mt-2 text-white opacity-90">
              {action.description}
            </p>
          </div>
          <div className="mt-6">
            <div className="flex items-center justify-end text-sm font-medium text-white opacity-80 group-hover:opacity-100 transition-opacity">
              <span>Ir ahora</span>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-1 transform group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </div>
          </div>
        </div>
      </Link>
    </Motion.div>
  );
};

export default ActionCard;