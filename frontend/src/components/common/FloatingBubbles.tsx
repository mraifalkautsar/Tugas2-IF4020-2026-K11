import React from 'react';

interface BubbleConfig {
  id: number;
  size: string;
  color: string;
  top?: string;
  bottom?: string;
  left?: string;
  right?: string;
  animationClass: string;
  delay?: string;
}

export const FloatingBubbles: React.FC = () => {
  const bubbles: BubbleConfig[] = [
    {
      id: 1,
      size: 'w-24 h-24 md:w-32 md:h-32',
      color: 'bg-[#DEC3A1]',
      top: '6%',
      left: '4%',
      animationClass: 'animate-float-1',
      delay: '0s',
    },
    {
      id: 2,
      size: 'w-28 h-28 md:w-36 md:h-36',
      color: 'bg-[#4542E0]',
      top: '12%',
      right: '5%',
      animationClass: 'animate-float-2',
      delay: '0.6s',
    },
    {
      id: 3,
      size: 'w-16 h-16 md:w-20 md:h-20',
      color: 'bg-[#EC8DD1]',
      top: '48%',
      left: '2%',
      animationClass: 'animate-float-3',
      delay: '1.2s',
    },
    {
      id: 4,
      size: 'w-24 h-24 md:w-28 md:h-28',
      color: 'bg-[#E75FA8]',
      bottom: '10%',
      left: '6%',
      animationClass: 'animate-float-4',
      delay: '1.8s',
    },
    {
      id: 5,
      size: 'w-28 h-28 md:w-36 md:h-36',
      color: 'bg-[#BE4BCE]',
      bottom: '12%',
      right: '6%',
      animationClass: 'animate-float-5',
      delay: '0.4s',
    },
    {
      id: 6,
      size: 'w-14 h-14 md:w-16 md:h-16',
      color: 'bg-[#DEC3A1]',
      top: '52%',
      right: '3%',
      animationClass: 'animate-float-1',
      delay: '2.4s',
    },
  ];

  return (
    <div
      className="fixed inset-0 pointer-events-none z-0 overflow-hidden select-none"
      aria-hidden="true"
    >
      {bubbles.map((b) => (
        <div
          key={b.id}
          className={`absolute rounded-full border-2 border-black shadow-[3px_3px_0px_#000000] ${b.size} ${b.color} ${b.animationClass} opacity-85 transition-transform`}
          style={{
            top: b.top,
            bottom: b.bottom,
            left: b.left,
            right: b.right,
            animationDelay: b.delay,
          }}
        >
          <div className="absolute top-2 left-2 w-3 h-3 md:w-4 md:h-4 rounded-full bg-white/70 border border-black/40" />
        </div>
      ))}
    </div>
  );
};

export default FloatingBubbles;
