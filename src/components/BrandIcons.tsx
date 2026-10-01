import React from 'react';

/**
 * Authentic, official-colored brand logos (Instagram gradient, YouTube red badge, WhatsApp green)
 * Clean SVG rendering without unwanted neon blur/glow.
 */

export const RealInstagramIcon: React.FC<{ className?: string }> = ({ className = "w-4 h-4" }) => {
  const id = React.useId().replace(/:/g, '');
  const gradId = `ig-grad-${id}`;

  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id={gradId} cx="20%" cy="110%" r="130%">
          <stop offset="0%" stopColor="#fdf497" />
          <stop offset="10%" stopColor="#fdf497" />
          <stop offset="35%" stopColor="#fd5949" />
          <stop offset="55%" stopColor="#d6249f" />
          <stop offset="90%" stopColor="#285AEB" />
        </radialGradient>
      </defs>
      {/* Authentic Instagram rounded gradient square */}
      <rect width="24" height="24" rx="6.5" fill={`url(#${gradId})`} />
      {/* Outer camera outline */}
      <rect x="5.25" y="5.25" width="13.5" height="13.5" rx="3.75" stroke="#FFFFFF" strokeWidth="1.8" />
      {/* Center lens */}
      <circle cx="12" cy="12" r="3.4" stroke="#FFFFFF" strokeWidth="1.8" />
      {/* Flash dot */}
      <circle cx="15.8" cy="8.2" r="0.9" fill="#FFFFFF" />
    </svg>
  );
};

export const RealYoutubeIcon: React.FC<{ className?: string }> = ({ className = "w-4 h-4" }) => {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Official YouTube red badge with subtle rounded rect */}
      <rect x="1" y="4" width="22" height="16" rx="4.5" fill="#FF0000" />
      {/* Solid white play triangle */}
      <polygon points="10,8.2 16.2,12 10,15.8" fill="#FFFFFF" />
    </svg>
  );
};

export const RealWhatsappIcon: React.FC<{ className?: string }> = ({ className = "w-4 h-4" }) => {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Official WhatsApp green circular base */}
      <circle cx="12" cy="12" r="11" fill="#25D366" />
      {/* Authentic WhatsApp speech bubble + phone symbol in crisp white */}
      <path
        d="M12.05 4.8a7.2 7.2 0 0 0-6.2 10.9L5 19l3.4-1.1a7.2 7.2 0 1 0 3.65-13.1zm3.6 10.3c-.2.5-.9 1-1.3 1.1-.4 0-.8.1-2.4-.6-1.9-.8-3.2-2.7-3.3-2.8-.1-.2-.8-1.1-.8-2.1 0-1 .5-1.5.7-1.7.2-.2.4-.3.6-.3.1 0 .3 0 .4.1.2.3.6 1.4.6 1.5 0 .2 0 .4-.1.5l-.3.4c-.1.1-.2.2-.1.4.2.4.6 1.1 1.2 1.6.8.7 1.5.9 1.8 1.1.2.1.4.1.5-.1.2-.2.6-.7.8-.9.2-.3.3-.2.5-.1.2.1 1.3.6 1.5.7.2.1.4.2.4.3.1.2.1.8-.1 1.3z"
        fill="#FFFFFF"
      />
    </svg>
  );
};
