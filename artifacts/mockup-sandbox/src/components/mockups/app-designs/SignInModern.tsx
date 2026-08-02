import React from 'react';

export function SignInModern() {
  return (
    <div
      style={{ width: 390, height: 844, overflow: 'hidden', position: 'relative' }}
      className="bg-gray-50 flex flex-col mx-auto font-sans"
      dir="rtl"
    >
      {/* Header */}
      <div 
        className="relative flex-none"
        style={{
          height: 340,
          background: 'linear-gradient(135deg, #0A4D2E 0%, #0D6B3F 100%)',
        }}
      >
        {/* Subtle grid pattern */}
        <div 
          className="absolute inset-0 opacity-10 pointer-events-none" 
          style={{
            backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)',
            backgroundSize: '16px 16px'
          }}
        />

        {/* Gold Strip */}
        <div 
          className="w-full h-[30px] flex items-center justify-center relative z-10"
          style={{ backgroundColor: '#C9963F' }}
        >
          <span className="text-white/90 text-[13px] font-medium tracking-wide">
            بسم الله الرحمن الرحيم
          </span>
        </div>

        {/* Header Content */}
        <div className="pt-10 px-8 relative z-10 flex flex-col items-center">
          {/* Top Row: Emblem & Text */}
          <div className="flex items-center justify-center gap-5 mb-8 w-full">
            {/* Emblem (Simplified) */}
            <div className="w-[60px] h-[60px] bg-white rounded-full flex items-center justify-center border-2 border-[#0A4D2E] shadow-sm relative overflow-hidden shrink-0">
               <span className="text-4xl translate-y-1">🌴</span>
               <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                 <svg width="40" height="40" viewBox="0 0 40 40" className="opacity-70">
                   <path d="M10 28 L30 12 M10 12 L30 28" stroke="#0A4D2E" strokeWidth="2.5" strokeLinecap="round" />
                 </svg>
               </div>
            </div>

            {/* Text Block */}
            <div className="flex flex-col text-white text-right">
              <span className="text-[18px] font-bold tracking-tight">المملكة العربية السعودية</span>
              <span className="text-[15px] font-medium opacity-90 leading-tight mt-0.5">وزارة الداخلية</span>
              <span className="text-[13px] font-medium mt-1" style={{ color: '#C9963F' }}>(٢٧٢)</span>
            </div>
          </div>

          {/* App Name */}
          <div className="mt-2 text-center">
            <h1 className="text-white text-[22px] font-bold tracking-wide">نظام إدارة الكوادر</h1>
            <p className="text-white/80 text-[13px] mt-1.5 font-medium tracking-wide">وكالة العمليات الأمنية</p>
          </div>
        </div>
      </div>

      {/* White Body - Overlapping Card */}
      <div 
        className="flex-1 bg-white relative z-20 flex flex-col px-6 pt-8 pb-8 shadow-[0_-8px_24px_rgba(0,0,0,0.12)]"
        style={{
          borderRadius: '24px 24px 0 0',
          marginTop: -24
        }}
      >
        <h2 className="text-[#0A4D2E] text-[22px] font-bold mb-7 text-right">تسجيل الدخول</h2>

        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-2 relative">
            <label className="text-sm font-semibold text-gray-700 text-right">رقم الهوية</label>
            <input 
              type="text" 
              className="w-full h-12 rounded-xl border border-[#E4EBE7] bg-[#FAFCFB] px-4 text-right focus:outline-none focus:border-[#0D6B3F] focus:ring-1 focus:ring-[#0D6B3F] transition-all text-base"
              placeholder="أدخل رقم الهوية"
            />
          </div>

          <div className="flex flex-col gap-2 relative">
            <label className="text-sm font-semibold text-gray-700 text-right">كلمة المرور</label>
            <input 
              type="password" 
              className="w-full h-12 rounded-xl border border-[#E4EBE7] bg-[#FAFCFB] px-4 text-right focus:outline-none focus:border-[#0D6B3F] focus:ring-1 focus:ring-[#0D6B3F] transition-all text-base"
              placeholder="أدخل كلمة المرور"
            />
          </div>
          
          <div className="flex justify-start">
            <button className="text-[13px] font-semibold text-[#0A4D2E] hover:underline transition-all">
              نسيت كلمة المرور؟
            </button>
          </div>

          <button className="w-full h-[52px] mt-3 bg-gradient-to-l from-[#0A4D2E] to-[#0D6B3F] hover:from-[#084227] hover:to-[#0A4D2E] text-white rounded-xl font-bold text-[16px] transition-all shadow-md shadow-[#0D6B3F]/25 flex items-center justify-center">
            تسجيل الدخول
          </button>
        </div>

        <div className="my-7 flex items-center justify-center gap-4">
          <div className="h-px bg-gray-100 flex-1"></div>
          <span className="text-gray-400 text-[13px] font-medium">أو</span>
          <div className="h-px bg-gray-100 flex-1"></div>
        </div>

        <button className="w-full h-[52px] border-2 border-[#E4EBE7] text-[#0A4D2E] rounded-xl font-bold text-[15px] hover:border-[#0A4D2E] hover:bg-[#0A4D2E]/5 transition-all">
          تسجيل موظف جديد
        </button>

        <div className="mt-auto pt-4 text-center">
          <p className="text-[#889990] text-[10px] tracking-wider font-semibold uppercase flex flex-col items-center gap-1 font-sans">
            <span>للاستخدام الداخلي فقط</span>
            <span>Government Internal System</span>
          </p>
        </div>
      </div>
    </div>
  );
}
