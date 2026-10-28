import React from 'react';

interface LogoProps extends React.SVGProps<SVGSVGElement> {
  className?: string;
  size?: number;
  blue?: string;
  yellow?: string;
  white?: string;
}

export function Logo({
  className = 'h-8 w-auto',
  size,
  blue = '#152E51',
  yellow = '#EAB308',
  white = '#FFFFFF',
  ...props
}: LogoProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="20 70 464 360"
      width={size || undefined}
      height={size || undefined}
      className={className}
      aria-hidden="true"
      {...props}
    >
      {/* White Document Paper Background */}
      <path
        d="M164 96
           H300
           L350 146
           V370
           Q350 380 340 380
           H166
           Q136 380 136 350
           V124
           Q136 96 164 96 Z"
        fill={white}
      />

      {/* Document outline with folded corner - Blue */}
      <path
        d="M164 96
           Q136 96 136 124
           V170
           M164 96 H300
           L350 146 V230
           M136 330 V350
           Q136 380 166 380
           H270"
        fill="none"
        stroke={blue}
        strokeWidth="26"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Folded corner flap - Yellow */}
      <path
        d="M300 96 V126
           Q300 146 320 146
           H350 Z"
        fill={yellow}
      />

      {/* Document text lines - Blue & Yellow */}
      <rect x="178" y="174" width="120" height="22" rx="11" fill={blue} />
      <rect x="178" y="218" width="136" height="22" rx="11" fill={yellow} />
      <rect x="178" y="262" width="112" height="22" rx="11" fill={blue} />

      {/* Motion lines - Vibrant Yellow */}
      <rect x="56" y="196" width="126" height="24" rx="12" fill={yellow} />
      <rect x="32" y="246" width="142" height="24" rx="12" fill={yellow} />
      <rect x="80" y="296" width="72" height="24" rx="12" fill={yellow} />

      {/* Person Silhouette - Blue with White separation ring */}
      <circle cx="382" cy="270" r="47" fill={white} />
      <circle cx="382" cy="270" r="43" fill={blue} />
      <path
        d="M296 397
           Q306 333 350 326
           Q382 343 414 326
           Q458 333 470 397
           Q474 420 451 420
           H315
           Q290 420 296 397 Z"
        fill={blue}
      />
    </svg>
  );
}
