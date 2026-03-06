interface MagazineCoverProps {
  backgroundImage: string;
  title?: string;
  storeName?: string;
  phone?: string;
  month?: string;
  logo?: string;
  theme?: string;
}

export function MagazineCover({ 
  backgroundImage, 
  title = 'هايبر براند',
  storeName = 'مجلة عروض السوبر ماركت',
  phone = '01554801630',
  month = '',
  logo = '',
  theme = '#2563eb'
}: MagazineCoverProps) {
  return (
    <div 
      className="relative w-full h-[297mm] print:h-screen flex items-center justify-center overflow-hidden print:break-after-page"
      dir="rtl"
      style={{
        background: `linear-gradient(135deg, ${theme} 0%, #9333ea 50%, #ec4899 100%)`,
        fontFamily: 'Cairo, sans-serif',
      }}
    >
      <div 
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage: `url(${backgroundImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      />
      
      {/* Logo at Top Right */}
      {logo && (
        <div className="absolute top-8 right-8 z-10">
          <img
            src={logo}
            alt="Logo"
            className="max-h-24 max-w-[300px] object-contain drop-shadow-2xl"
          />
        </div>
      )}
      
      {/* Main Content - Center */}
      <div className="relative z-10 text-center text-white px-8">
        <h1 
          className="text-8xl font-black mb-4 drop-shadow-2xl tracking-tight"
          style={{ fontFamily: 'Cairo, sans-serif' }}
        >
          {title}
        </h1>
        <div 
          className="w-32 h-1 mx-auto mb-6"
          style={{ backgroundColor: '#facc15' }}
        ></div>
        <h2 
          className="text-4xl font-semibold drop-shadow-lg"
          style={{ fontFamily: 'Cairo, sans-serif' }}
        >
          {storeName}
        </h2>
        
        <p 
          className="text-2xl mt-8 drop-shadow-md opacity-90"
          style={{ fontFamily: 'Cairo, sans-serif' }}
        >
          عروض مميزة • أسعار لا تقاوم
        </p>
      </div>

      {/* Address - Bottom Left */}
      <div 
        className="absolute bottom-8 left-8 z-10 flex items-center gap-3 text-white"
        style={{ fontFamily: 'Cairo, sans-serif' }}
      >
        <svg 
          className="size-8 drop-shadow-md" 
          xmlns="http://www.w3.org/2000/svg" 
          width="24" 
          height="24" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2.5" 
          strokeLinecap="round" 
          strokeLinejoin="round"
        >
          <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
          <circle cx="12" cy="10" r="3"/>
        </svg>
        <p className="text-2xl font-semibold drop-shadow-md">
          شارع ابو كلام بساحل طهطا
        </p>
      </div>

      {/* Phone - Bottom Right */}
      <div 
        className="absolute bottom-8 right-8 z-10 flex items-center gap-3 text-white"
        style={{ fontFamily: 'Cairo, sans-serif' }}
      >
        <p className="text-2xl font-semibold drop-shadow-md" dir="ltr">
          {phone}
        </p>
        <svg 
          className="size-8 drop-shadow-md" 
          xmlns="http://www.w3.org/2000/svg" 
          width="24" 
          height="24" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2.5" 
          strokeLinecap="round" 
          strokeLinejoin="round"
        >
          <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
        </svg>
      </div>
    </div>
  );
}