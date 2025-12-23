import React from 'react';

interface TooltipProps {
  content: string;
  children: React.ReactNode;
}

export const Tooltip: React.FC<TooltipProps> = ({ content, children }) => {
  return (
    <div className="group relative flex justify-center">
      {children}
      <div className="absolute bottom-full mb-2 hidden group-hover:block w-max max-w-xs px-2 py-1 bg-black text-white text-xs rounded opacity-90 z-50 pointer-events-none">
        {content}
        <div className="absolute left-1/2 -bottom-1 -translate-x-1/2 w-2 h-2 bg-black rotate-45"></div>
      </div>
    </div>
  );
};