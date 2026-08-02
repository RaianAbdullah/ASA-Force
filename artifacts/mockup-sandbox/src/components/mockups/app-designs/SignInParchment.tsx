import React from 'react';

export function SignInParchment() {
  return (
    <div 
      className="relative flex flex-col items-center justify-between mx-auto shadow-2xl"
      style={{
        width: 390,
        height: 844,
        overflow: 'hidden',
        backgroundColor: '#F5EFD6',
        direction: 'rtl',
        fontFamily: '"Amiri", "Times New Roman", serif',
      }}
    >
      {/* Texture overlay for parchment feel */}
      <div 
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")',
        }}
      />

      {/* Top Strip */}
      <div className="w-full h-10 bg-[#0A4D2E] flex items-center justify-center shrink-0 z-10 shadow-sm relative">
        <span className="text-[#C9963F] text-xs font-semibold tracking-wide" style={{ fontFamily: 'Tahoma, sans-serif' }}>
          بسم الله الرحمن الرحيم
        </span>
      </div>

      <div className="flex-1 w-full flex flex-col items-center px-6 pt-10 pb-6 overflow-y-auto z-10 relative">
        
        {/* Emblem Area */}
        <div className="flex flex-col items-center mb-6">
          <div className="relative w-24 h-24 mb-4 rounded-full flex items-center justify-center p-1" style={{ border: '1px solid #C9963F' }}>
            <div className="w-full h-full bg-white rounded-full flex flex-col items-center justify-center shadow-inner" style={{ border: '3px solid #0A4D2E' }}>
              <span className="text-3xl text-[#0A4D2E] leading-none mb-1">🌴</span>
              <span className="text-xl text-[#0A4D2E] leading-none">⚔</span>
            </div>
          </div>
          
          <h1 className="text-xl font-bold text-[#1A1F1C] mb-1">المملكة العربية السعودية</h1>
          <h2 className="text-lg font-medium text-[#1A1F1C] mb-1">وزارة الداخلية</h2>
          <span className="text-sm font-medium text-[#C9963F]">(٢٧٢)</span>
        </div>

        {/* Divider */}
        <div className="w-[60%] flex flex-col gap-[2px] items-center my-4">
          <div className="w-full h-[1px] bg-[#C9963F] opacity-70"></div>
          <div className="w-full h-[1px] bg-[#C9963F] opacity-70"></div>
        </div>

        {/* App Title */}
        <h3 className="text-2xl font-bold text-[#0A4D2E] my-4 tracking-tight">نظام إدارة الكوادر</h3>

        {/* Form Card */}
        <div className="w-full bg-white rounded-2xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.1)] p-6 mt-2 relative border border-[#E5DFB3]">
          
          <div className="space-y-4">
            <div className="space-y-1.5 text-right">
              <label className="text-sm font-semibold text-[#1A1F1C] block px-1" style={{ fontFamily: 'Tahoma, sans-serif' }}>رقم الهوية</label>
              <input 
                type="text" 
                placeholder="١٠٠٠٠٠٠٠٠٠"
                className="w-full bg-white border border-[#D5CFA3] rounded-lg px-4 py-3 text-right focus:outline-none focus:ring-2 focus:ring-[#C9963F] focus:border-transparent transition-all placeholder:text-gray-300"
                style={{ fontFamily: 'Tahoma, sans-serif', direction: 'rtl' }}
              />
            </div>

            <div className="space-y-1.5 text-right">
              <label className="text-sm font-semibold text-[#1A1F1C] block px-1" style={{ fontFamily: 'Tahoma, sans-serif' }}>كلمة المرور</label>
              <input 
                type="password" 
                placeholder="••••••••"
                className="w-full bg-white border border-[#D5CFA3] rounded-lg px-4 py-3 text-right focus:outline-none focus:ring-2 focus:ring-[#C9963F] focus:border-transparent transition-all placeholder:text-gray-300"
                style={{ fontFamily: 'Tahoma, sans-serif', direction: 'rtl' }}
              />
            </div>

            <div className="pt-2 space-y-3">
              <button 
                className="w-full bg-[#0A4D2E] text-white rounded-lg py-3.5 font-bold hover:bg-[#073821] active:bg-[#062c19] transition-colors shadow-md flex items-center justify-center gap-2"
                style={{ fontFamily: 'Tahoma, sans-serif' }}
              >
                تسجيل الدخول
              </button>
              
              <button 
                className="w-full bg-transparent text-[#0A4D2E] border-2 border-[#0A4D2E] rounded-lg py-3 font-semibold hover:bg-[#f0f4f1] active:bg-[#e4ece7] transition-colors"
                style={{ fontFamily: 'Tahoma, sans-serif' }}
              >
                موظف جديد — تسجيل
              </button>
            </div>
          </div>
          
        </div>
        
      </div>

      {/* Footer Strip */}
      <div className="w-full h-8 bg-[#0A4D2E] flex items-center justify-center shrink-0 z-10 relative">
        <span className="text-[#C9963F] text-[10px] font-semibold tracking-widest" style={{ fontFamily: 'Tahoma, sans-serif' }}>
          للاستخدام الداخلي فقط
        </span>
      </div>
    </div>
  );
}
