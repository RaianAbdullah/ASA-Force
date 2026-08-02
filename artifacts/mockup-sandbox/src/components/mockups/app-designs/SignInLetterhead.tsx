import React from "react";
import { Lock, User } from "lucide-react";

export function SignInLetterhead() {
  return (
    <div
      style={{ width: 390, height: 844, fontFamily: "ui-sans-serif, system-ui, sans-serif" }}
      className="bg-white overflow-hidden relative shadow-xl mx-auto flex flex-col"
      dir="rtl"
    >
      <style dangerouslySetInnerHTML={{__html: `
        @import url('https://fonts.googleapis.com/css2?family=Amiri:wght@400;700&display=swap');
        .font-amiri { font-family: 'Amiri', serif; }
      `}} />
      
      {/* Header Strip */}
      <div className="bg-[#FDFAF4] border-b-[2px] border-[#0A4D2E] pt-14 pb-5 px-6 flex flex-col relative z-10 shadow-[0_4px_10px_-5px_rgba(0,0,0,0.1)]">
        {/* Bismillah */}
        <div className="text-right px-1 mb-3">
          <span className="text-[13px] text-gray-800 font-amiri tracking-wider">
            بسم الله الرحمن الرحيم
          </span>
        </div>
        
        <div className="flex items-center justify-between px-1">
          {/* Text Block (Right visually in RTL) */}
          <div className="flex flex-col text-right">
            <span className="text-[20px] font-bold text-gray-900 font-amiri leading-tight">
              المملكة العربية السعودية
            </span>
            <span className="text-[17px] text-gray-800 font-amiri leading-tight mt-1.5">
              وزارة الداخلية
            </span>
            <span className="text-[14px] text-gray-600 font-amiri mt-1">
              (٢٧٢)
            </span>
          </div>
          
          {/* Emblem (Left visually in RTL) */}
          <div className="flex-shrink-0 relative w-16 h-16 rounded-full border border-gray-300 flex items-center justify-center bg-transparent ml-2">
            {/* Simple SVG representation of palm and swords */}
            <svg viewBox="0 0 100 100" className="w-11 h-11 text-[#0A4D2E] fill-current opacity-90">
              <path d="M50 18 L53 30 L67 23 L57 37 L71 45 L56 49 L64 63 L50 54 L36 63 L44 49 L29 45 L43 37 L33 23 L47 30 Z" />
              <path d="M22 75 L78 93 L83 88 L27 70 Z" />
              <path d="M78 75 L22 93 L17 88 L73 70 Z" />
            </svg>
          </div>
        </div>
      </div>

      {/* Body Content */}
      <div className="flex-1 flex flex-col px-6 pt-10 pb-8 relative z-0">
        <div className="text-center mb-8">
          <h1 className="text-[26px] font-bold text-[#0A4D2E] mb-2 font-amiri">
            نظام إدارة الكوادر
          </h1>
          <p className="text-[15px] text-gray-500 font-medium">
            وكالة العمليات الأمنية
          </p>
        </div>
        
        <div className="w-16 h-[2px] bg-gray-200 mx-auto mb-10 rounded-full" />
        
        {/* Form Card */}
        <div className="bg-white rounded-2xl shadow-[0_8px_30px_-4px_rgba(0,0,0,0.06)] border border-gray-100 p-6 w-full flex-grow-0">
          <div className="space-y-5">
            <div className="space-y-2">
              <label className="text-[14px] font-medium text-gray-700 block text-right px-1">
                رقم الهوية
              </label>
              <div className="relative">
                <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                  <User className="w-[18px] h-[18px]" strokeWidth={2.5} />
                </div>
                <input 
                  type="text" 
                  placeholder="أدخل رقم الهوية"
                  className="w-full h-[52px] bg-gray-50/50 border border-gray-200 rounded-xl pr-[2.6rem] pl-4 text-right focus:outline-none focus:ring-2 focus:ring-[#0A4D2E]/20 focus:border-[#0A4D2E] transition-all placeholder:text-gray-400 text-[15px]"
                  dir="rtl"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-[14px] font-medium text-gray-700 block text-right px-1">
                كلمة المرور
              </label>
              <div className="relative">
                <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                  <Lock className="w-[18px] h-[18px]" strokeWidth={2.5} />
                </div>
                <input 
                  type="password" 
                  placeholder="أدخل كلمة المرور"
                  className="w-full h-[52px] bg-gray-50/50 border border-gray-200 rounded-xl pr-[2.6rem] pl-4 text-right focus:outline-none focus:ring-2 focus:ring-[#0A4D2E]/20 focus:border-[#0A4D2E] transition-all placeholder:text-gray-400 text-[15px] font-sans"
                  dir="rtl"
                />
              </div>
            </div>

            <div className="pt-4">
              <button className="w-full h-[52px] bg-[#0A4D2E] text-white rounded-xl font-medium text-[16px] hover:bg-[#083b23] transition-colors active:scale-[0.98] shadow-sm">
                تسجيل الدخول
              </button>
            </div>
            
            <div className="pt-2">
              <button className="w-full h-[52px] bg-transparent text-[#0A4D2E] border border-[#0A4D2E]/20 rounded-xl font-medium text-[15px] hover:bg-[#0A4D2E]/5 transition-colors active:scale-[0.98]">
                موظف جديد — تسجيل
              </button>
            </div>
          </div>
        </div>
        
        <div className="mt-auto pt-6 text-center">
          <p className="text-[12px] text-gray-400 tracking-wide font-medium">
            للاستخدام الداخلي فقط · Government Internal System
          </p>
        </div>
      </div>
    </div>
  );
}
