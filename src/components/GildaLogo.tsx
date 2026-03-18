type GildaLogoProps = {
  className?: string;
};

const GildaLogo = ({ className }: GildaLogoProps) => {
  return (
    <svg
      viewBox="0 0 64 64"
      className={className}
      role="img"
      aria-label="Logo de calavera chef con cucharas cruzadas"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Chef hat */}
      <path
        d="M22 19.5C22 16.6 24.4 14.2 27.3 14.2C28.9 14.2 30.3 14.9 31.3 16C32.2 14.5 33.9 13.5 35.9 13.5C38.7 13.5 41 15.6 41.5 18.3C43.8 18.6 45.6 20.5 45.6 22.8C45.6 25.3 43.5 27.4 41 27.4H23.9C21.2 27.4 19 25.2 19 22.5C19 21.1 19.6 19.9 20.6 19.1"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <line x1="23.5" y1="29.4" x2="40.5" y2="29.4" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />

      {/* Skull */}
      <circle cx="32" cy="38" r="10.8" stroke="currentColor" strokeWidth="2.2" />
      <rect x="25.6" y="44.4" width="12.8" height="7" rx="2" stroke="currentColor" strokeWidth="2.2" />
      <circle cx="28.2" cy="37" r="2" fill="currentColor" />
      <circle cx="35.8" cy="37" r="2" fill="currentColor" />
      <path d="M32 39.7L30.5 42.2H33.5L32 39.7Z" fill="currentColor" />
    </svg>
  );
};

export default GildaLogo;
