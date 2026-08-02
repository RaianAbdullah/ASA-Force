import React, { useState } from 'react';
import { 
  Home, CalendarDays, Plane, MessageCircle, User, 
  MapPin, Clock, Fingerprint, ChevronRight, CheckCircle2, 
  Clock3, Plus, Search, LogOut, Lock, Mail, Battery, Wifi, Signal,
  FileText, ShieldCheck, Settings,
  Briefcase
} from 'lucide-react';

export default function EmeraldEnterprise() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [activeTab, setActiveTab] = useState('home');

  return (
    <div className="w-full h-screen overflow-hidden flex flex-col bg-[#F4F7F5] font-sans relative text-right selection:bg-[#0A4D2E]/20" dir="rtl">
      {/* iOS Status Bar */}
      <div className="absolute top-0 w-full h-12 flex items-center justify-between px-6 z-50 text-white pointer-events-none">
        <span className="text-[13px] font-semibold mt-1 tracking-wider">9:41</span>
        <div className="flex items-center gap-1.5 mt-1">
          <Signal size={15} className="fill-current" />
          <Wifi size={15} className="fill-current" />
          <Battery size={16} className="fill-current opacity-90" />
        </div>
      </div>

      {!isLoggedIn ? (
        <LoginScreen onLogin={() => setIsLoggedIn(true)} />
      ) : (
        <>
          <div className="flex-1 overflow-y-auto overflow-x-hidden relative [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            {activeTab === 'home' && <HomeScreen />}
            {activeTab === 'schedule' && <ScheduleScreen />}
            {activeTab === 'vacations' && <VacationsScreen />}
            {activeTab === 'messages' && <MessagesScreen />}
            {activeTab === 'profile' && <ProfileScreen onLogout={() => { setIsLoggedIn(false); setActiveTab('home'); }} />}
          </div>
          <TabBar activeTab={activeTab} onTabChange={setActiveTab} />
        </>
      )}
    </div>
  );
}

const LoginScreen = ({ onLogin }: { onLogin: () => void }) => {
  return (
    <div className="flex-1 flex flex-col bg-gradient-to-br from-[#0A4D2E] to-[#0D6B3F] text-white relative overflow-hidden pt-12">
      {/* Decorative background elements */}
      <div className="absolute -top-32 -right-32 w-96 h-96 bg-[#C9963F] opacity-20 rounded-full blur-[100px]"></div>
      <div className="absolute bottom-0 -left-20 w-80 h-80 bg-white opacity-10 rounded-full blur-[80px]"></div>
      
      <div className="flex-1 flex flex-col justify-center px-6 w-full z-10 space-y-10">
        <div className="text-center space-y-4">
          <div className="w-20 h-20 bg-white/10 rounded-[20px] mx-auto flex items-center justify-center backdrop-blur-md border border-white/20 shadow-[0_8px_32px_rgba(0,0,0,0.1)]">
            <span className="text-3xl font-bold text-[#C9963F] font-serif leading-none mt-1">وزارة</span>
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight mb-1.5">نظام الموارد البشرية</h1>
            <p className="text-white/70 text-sm font-medium">بوابة الخدمات الذاتية للموظفين</p>
          </div>
        </div>

        <div className="bg-white rounded-[24px] p-6 shadow-2xl space-y-6 text-gray-800 border border-white/20 relative">
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-500 mr-1">البريد الإلكتروني</label>
              <div className="relative">
                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">
                  <Mail size={18} />
                </div>
                <input 
                  type="text" 
                  defaultValue="rayan@gov.sa"
                  className="w-full bg-gray-50 rounded-xl py-3.5 pr-11 pl-4 text-sm font-semibold border border-gray-100 focus:outline-none focus:ring-2 focus:ring-[#0A4D2E]/20 focus:border-[#0A4D2E] transition-all"
                  dir="ltr"
                />
              </div>
            </div>
            
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-500 mr-1">كلمة المرور</label>
              <div className="relative">
                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">
                  <Lock size={18} />
                </div>
                <input 
                  type="password" 
                  defaultValue="••••••••"
                  className="w-full bg-gray-50 rounded-xl py-3.5 pr-11 pl-4 text-sm font-semibold border border-gray-100 focus:outline-none focus:ring-2 focus:ring-[#0A4D2E]/20 focus:border-[#0A4D2E] transition-all"
                  dir="ltr"
                />
              </div>
            </div>
          </div>
          
          <div className="flex justify-between items-center text-xs">
            <label className="flex items-center gap-2 cursor-pointer group">
              <div className="relative w-4 h-4 rounded border border-gray-300 bg-white flex items-center justify-center group-hover:border-[#0A4D2E] transition-colors">
                <div className="w-2.5 h-2.5 bg-[#0A4D2E] rounded-sm"></div>
              </div>
              <span className="text-gray-600 font-semibold select-none">تذكرني</span>
            </label>
            <button className="text-[#0A4D2E] font-bold hover:underline">نسيت كلمة المرور؟</button>
          </div>

          <button 
            onClick={onLogin}
            className="w-full bg-[#0A4D2E] text-white font-bold py-4 rounded-xl shadow-[0_8px_20px_rgba(10,77,46,0.3)] hover:bg-[#083b23] transition-all active:scale-[0.98] active:shadow-sm"
          >
            تسجيل الدخول
          </button>
        </div>
        
        <div className="text-center mt-auto pb-4">
          <p className="text-white/60 text-xs font-medium">الدعم الفني: 800-123-4567</p>
        </div>
      </div>
    </div>
  );
};

const HomeScreen = () => {
  return (
    <div className="flex flex-col pb-8 min-h-full">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#0A4D2E] to-[#0D6B3F] text-white px-6 pt-14 pb-12 rounded-b-[32px] shadow-md relative z-0">
        <div className="absolute inset-0 overflow-hidden rounded-b-[32px]">
           <div className="absolute -top-10 -right-10 w-40 h-40 bg-[#C9963F]/10 rounded-full blur-[40px]"></div>
           <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-white/5 rounded-full blur-[30px]"></div>
        </div>
        <div className="relative z-10">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-white/80 text-sm font-medium">مرحباً بك مجدداً،</p>
              <h2 className="text-2xl font-bold mt-1">ريان أبوطالب</h2>
            </div>
            <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center backdrop-blur-md border border-white/20 shadow-inner">
              <User size={24} className="text-white" />
            </div>
          </div>
          
          <div className="mt-8 flex items-center gap-2 text-white/95 bg-white/10 w-fit px-3 py-2 rounded-full text-xs font-semibold backdrop-blur-md border border-white/10 shadow-sm">
            <CalendarDays size={14} className="text-[#C9963F]" />
            <span>الأربعاء ٢٢ يوليو ٢٠٢٦</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-6 -mt-6 z-10 space-y-5">
        {/* Check-in Card */}
        <div className="bg-white rounded-[24px] p-5 shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-gray-100/50 flex flex-col items-center">
          <div className="w-16 h-16 bg-[#0A4D2E]/5 text-[#0A4D2E] rounded-full flex items-center justify-center mb-3 border border-[#0A4D2E]/10">
            <Fingerprint size={32} />
          </div>
          <h3 className="text-gray-900 font-bold text-lg">تسجيل الحضور</h3>
          <p className="text-gray-500 text-sm mt-1 text-center mb-5 font-medium">
            أنت حالياً داخل النطاق الجغرافي المسموح به للعمل
          </p>
          
          <button className="w-full bg-[#0A4D2E] text-white font-bold py-4 rounded-xl shadow-[0_8px_20px_rgba(10,77,46,0.25)] flex items-center justify-center gap-2 hover:bg-[#083b23] active:scale-[0.98] transition-all">
            <MapPin size={18} className="opacity-80" />
            <span>تسجيل دخول - ٠٨:١٤ ص</span>
          </button>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white rounded-[20px] p-4 shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-gray-100 flex flex-col justify-between aspect-[1.1]">
            <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center mb-2">
              <CheckCircle2 size={20} />
            </div>
            <div>
              <p className="text-gray-500 text-xs font-bold mb-1">أيام الحضور</p>
              <div className="flex items-end gap-1">
                <span className="text-2xl font-black text-gray-900 leading-none">١٨</span>
                <span className="text-gray-400 text-[11px] font-semibold mb-0.5">/ ٢٢ يوم</span>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-[20px] p-4 shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-gray-100 flex flex-col justify-between aspect-[1.1]">
            <div className="w-10 h-10 bg-amber-50 text-[#C9963F] rounded-xl flex items-center justify-center mb-2">
              <Clock3 size={20} />
            </div>
            <div>
              <p className="text-gray-500 text-xs font-bold mb-1">ساعات التأخير</p>
              <div className="flex items-end gap-1">
                <span className="text-2xl font-black text-gray-900 leading-none">٢.٥</span>
                <span className="text-gray-400 text-[11px] font-semibold mb-0.5">ساعة</span>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="space-y-3 pt-2">
          <div className="flex justify-between items-center px-1">
            <h3 className="font-bold text-gray-900">سجل الحضور الأخير</h3>
            <button className="text-xs font-bold text-[#C9963F]">عرض الكل</button>
          </div>
          
          <div className="bg-white rounded-[20px] shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-gray-100 overflow-hidden divide-y divide-gray-50">
            {[
              { day: 'الثلاثاء', date: '٢١ يوليو', in: '٠٨:٠٥ ص', out: '٠٤:١٠ م' },
              { day: 'الاثنين', date: '٢٠ يوليو', in: '٠٨:١٢ ص', out: '٠٤:٠٠ م' },
            ].map((record, i) => (
              <div key={i} className="p-4 flex items-center justify-between hover:bg-gray-50/50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 bg-[#F4F7F5] rounded-xl flex items-center justify-center text-[#0A4D2E] font-black text-[11px] border border-gray-100/50">
                    {record.date.split(' ')[0]}
                  </div>
                  <div>
                    <p className="font-bold text-[13px] text-gray-900">{record.day}</p>
                    <p className="text-[11px] font-medium text-gray-500 mt-0.5">{record.date}</p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1.5">
                  <span className="text-[11px] font-bold text-gray-600 bg-gray-50 px-2 py-0.5 rounded flex items-center gap-1.5 border border-gray-100 w-[72px]">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                    {record.in}
                  </span>
                  <span className="text-[11px] font-bold text-gray-600 bg-gray-50 px-2 py-0.5 rounded flex items-center gap-1.5 border border-gray-100 w-[72px]">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-400"></span>
                    {record.out}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const ScheduleScreen = () => {
  const days = [
    { name: 'الأحد', active: true },
    { name: 'الإثنين', active: true },
    { name: 'الثلاثاء', active: true },
    { name: 'الأربعاء', active: true, today: true },
    { name: 'الخميس', active: true },
    { name: 'الجمعة', active: false },
    { name: 'السبت', active: false },
  ];

  return (
    <div className="flex flex-col min-h-full pb-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#0A4D2E] to-[#0D6B3F] text-white px-6 pt-14 pb-10 relative shadow-md z-10 rounded-b-[32px]">
        <div className="absolute inset-0 overflow-hidden rounded-b-[32px]">
           <div className="absolute -top-10 -right-10 w-40 h-40 bg-[#C9963F]/10 rounded-full blur-[40px]"></div>
        </div>
        <div className="relative z-10">
          <h2 className="text-2xl font-bold">جدول العمل</h2>
          <p className="text-white/80 text-sm mt-1 font-medium">الأسبوع الحالي (١٩ - ٢٥ يوليو)</p>
        </div>
      </div>
      
      <div className="flex-1 px-6 -mt-4 z-20 space-y-5">
        <div className="bg-white rounded-[24px] shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-gray-100 p-5">
          <div className="flex items-center justify-between border-b border-gray-50 pb-4 mb-4">
            <h3 className="font-bold text-gray-900 text-lg">الوردية الصباحية</h3>
            <span className="bg-[#0A4D2E]/10 text-[#0A4D2E] text-[11px] font-bold px-3 py-1 rounded-full">الوردية الحالية</span>
          </div>
          
          <div className="flex justify-between mb-6 px-2">
            <div className="flex gap-3 items-center">
              <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
                <Clock size={20} />
              </div>
              <div>
                <p className="text-[11px] text-gray-500 font-bold">بداية الوردية</p>
                <p className="font-black text-gray-900 mt-0.5">٠٨:٠٠ ص</p>
              </div>
            </div>
            
            <div className="w-[1px] h-10 bg-gray-100"></div>
            
            <div className="flex gap-3 items-center">
              <div className="w-10 h-10 bg-gray-50 text-gray-500 rounded-xl flex items-center justify-center">
                <Clock size={20} />
              </div>
              <div>
                <p className="text-[11px] text-gray-500 font-bold">نهاية الوردية</p>
                <p className="font-black text-gray-900 mt-0.5">٠٤:٠٠ م</p>
              </div>
            </div>
          </div>
          
          <div>
            <p className="text-xs font-bold text-gray-500 mb-3 px-1">أيام العمل</p>
            <div className="flex gap-1.5 justify-between">
              {days.map((day, i) => (
                <div key={i} className={`flex flex-col items-center justify-center w-[46px] h-[60px] rounded-xl text-[11px] font-bold border transition-colors
                  ${day.today ? 'bg-[#0A4D2E] text-white border-[#0A4D2E] shadow-[0_4px_12px_rgba(10,77,46,0.3)]' :
                    day.active ? 'bg-white text-gray-700 border-gray-200' : 
                    'bg-gray-50 text-gray-300 border-gray-100'}`}
                >
                  <span>{day.name.substring(0, 3)}</span>
                  {day.today && <div className="w-1 h-1 bg-[#C9963F] rounded-full mt-1.5"></div>}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-[#0A4D2E] to-[#0D6B3F] rounded-[20px] p-5 text-white shadow-[0_8px_20px_rgba(10,77,46,0.2)] flex items-center justify-between border border-[#0A4D2E]/50">
          <div>
            <h3 className="font-bold text-base">طلب تغيير وردية</h3>
            <p className="text-white/80 text-[11px] font-medium mt-1 leading-relaxed max-w-[200px]">هل ترغب في تغيير جدول عملك للأسبوع القادم؟</p>
          </div>
          <button className="bg-[#C9963F] text-white p-3 rounded-xl shadow-md hover:bg-[#b08133] active:scale-95 transition-all shrink-0">
            <Plus size={20} strokeWidth={3} />
          </button>
        </div>
      </div>
    </div>
  );
};

const VacationsScreen = () => {
  return (
    <div className="flex flex-col min-h-full pb-8">
      <div className="bg-gradient-to-r from-[#0A4D2E] to-[#0D6B3F] text-white px-6 pt-14 pb-12 relative shadow-md z-10 rounded-b-[32px]">
        <div className="absolute inset-0 overflow-hidden rounded-b-[32px]">
           <div className="absolute top-0 right-10 w-32 h-32 bg-[#C9963F]/15 rounded-full blur-[30px]"></div>
        </div>
        <div className="relative z-10">
          <h2 className="text-2xl font-bold">الإجازات</h2>
          <div className="flex items-center gap-2 mt-2">
            <Briefcase size={14} className="text-[#C9963F]" />
            <p className="text-white/90 text-[13px] font-medium">رصيد الإجازات السنوية: <span className="font-bold text-white">٢٤ يوم</span></p>
          </div>
        </div>
      </div>

      <div className="px-6 -mt-5 z-20 space-y-5">
        {/* Filter/Tabs */}
        <div className="flex bg-white p-1 rounded-xl shadow-sm border border-gray-100">
          <button className="flex-1 bg-[#F4F7F5] text-[#0A4D2E] font-bold text-xs py-2.5 rounded-lg shadow-sm border border-gray-100">طلباتي</button>
          <button className="flex-1 text-gray-500 font-bold text-xs py-2.5 rounded-lg hover:text-gray-700">سجل الإجازات</button>
        </div>

        {/* Requests List */}
        <div className="space-y-3">
          <div className="bg-white rounded-[20px] shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-gray-100 p-4">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
                  <Plane size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-sm">إجازة اعتيادية</h3>
                  <p className="text-[11px] font-semibold text-gray-500 mt-0.5">لمدة ٥ أيام</p>
                </div>
              </div>
              <span className="bg-amber-50 border border-amber-100 text-amber-600 text-[10px] font-bold px-2.5 py-1 rounded-md">مرفوعة</span>
            </div>
            <div className="bg-[#F4F7F5] rounded-xl p-3 flex justify-between items-center border border-gray-100/50">
              <div className="flex flex-col">
                <span className="text-[10px] text-gray-500 font-bold mb-1">من</span>
                <span className="font-black text-gray-800 text-xs">٠١ أغسطس ٢٠٢٦</span>
              </div>
              <ChevronRight size={16} className="text-gray-300 mx-2" />
              <div className="flex flex-col text-left">
                <span className="text-[10px] text-gray-500 font-bold mb-1">إلى</span>
                <span className="font-black text-gray-800 text-xs">٠٥ أغسطس ٢٠٢٦</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-[20px] shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-gray-100 p-4 opacity-75">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center">
                  <Plane size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-sm">إجازة اضطرارية</h3>
                  <p className="text-[11px] font-semibold text-gray-500 mt-0.5">لمدة يومين</p>
                </div>
              </div>
              <span className="bg-emerald-50 border border-emerald-100 text-emerald-600 text-[10px] font-bold px-2.5 py-1 rounded-md">مقبولة</span>
            </div>
            <div className="bg-[#F4F7F5] rounded-xl p-3 flex justify-between items-center border border-gray-100/50">
              <div className="flex flex-col">
                <span className="text-[10px] text-gray-500 font-bold mb-1">من</span>
                <span className="font-black text-gray-800 text-xs">١٢ يونيو ٢٠٢٦</span>
              </div>
              <ChevronRight size={16} className="text-gray-300 mx-2" />
              <div className="flex flex-col text-left">
                <span className="text-[10px] text-gray-500 font-bold mb-1">إلى</span>
                <span className="font-black text-gray-800 text-xs">١٣ يونيو ٢٠٢٦</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* FAB - Fixed relative to the viewport so it stays above scrolling content but below status/tabs if needed.
          Since content scrolls inside this div, fixed positions it relative to the iframe. */}
      <div className="fixed bottom-24 left-6 z-40">
        <button className="w-14 h-14 bg-[#C9963F] text-white rounded-full flex items-center justify-center shadow-[0_8px_20px_rgba(201,150,63,0.4)] hover:bg-[#b58535] active:scale-95 transition-all">
          <Plus size={24} strokeWidth={3} />
        </button>
      </div>
    </div>
  );
};

const MessagesScreen = () => {
  const messages = [
    { name: 'فهد العتيبي', role: 'مدير الموارد البشرية', time: '١٠:٣٠ ص', text: 'تم الموافقة على طلب البدلات الخاص بك.', unread: 2, avatar: 'from-emerald-100 to-emerald-200 text-emerald-700' },
    { name: 'سارة خالد', role: 'الإدارة المالية', time: 'أمس', text: 'الرجاء تحديث الآيبان في النظام لاعتماد الراتب.', unread: 0, avatar: 'from-amber-100 to-amber-200 text-amber-700' },
    { name: 'عبدالله محمد', role: 'الدعم الفني', time: '١٨ يوليو', text: 'تم حل المشكلة المتعلقة بنظام الحضور والانصراف.', unread: 0, avatar: 'from-blue-100 to-blue-200 text-blue-700' },
  ];

  return (
    <div className="flex flex-col min-h-full pb-8">
      <div className="bg-gradient-to-r from-[#0A4D2E] to-[#0D6B3F] text-white px-6 pt-14 pb-8 relative shadow-md z-10 rounded-b-[32px]">
        <h2 className="text-2xl font-bold">الرسائل</h2>
        
        <div className="relative mt-5">
          <div className="absolute right-4 top-1/2 -translate-y-1/2 text-white/50">
            <Search size={18} />
          </div>
          <input 
            type="text" 
            placeholder="بحث في الرسائل..." 
            className="w-full bg-white/10 border border-white/10 rounded-xl py-3 pr-11 pl-4 text-sm font-medium text-white placeholder-white/50 focus:outline-none focus:bg-white/20 transition-colors backdrop-blur-sm shadow-inner"
          />
        </div>
      </div>

      <div className="px-4 pt-4 space-y-2">
        {messages.map((msg, i) => (
          <div key={i} className="bg-white p-4 rounded-[20px] shadow-sm border border-gray-100 flex items-start gap-4 active:bg-gray-50 transition-colors cursor-pointer">
            <div className="relative shrink-0">
              <div className={`w-12 h-12 bg-gradient-to-br ${msg.avatar} rounded-full flex items-center justify-center border-2 border-white shadow-sm overflow-hidden`}>
                <User size={20} className="opacity-80" />
              </div>
            </div>
            
            <div className="flex-1 min-w-0 pt-0.5">
              <div className="flex justify-between items-center mb-1">
                <h3 className={`font-bold text-[14px] truncate ${msg.unread > 0 ? 'text-gray-900' : 'text-gray-700'}`}>{msg.name}</h3>
                <span className="text-[10px] font-bold text-gray-400 shrink-0">{msg.time}</span>
              </div>
              <p className="text-[10px] text-[#0A4D2E] font-bold mb-1.5">{msg.role}</p>
              <p className={`text-[12px] truncate ${msg.unread > 0 ? 'text-gray-800 font-semibold' : 'text-gray-500 font-medium'}`}>{msg.text}</p>
            </div>
            
            {msg.unread > 0 && (
              <div className="w-5 h-5 mt-2 shrink-0 rounded-full bg-[#C9963F] text-white flex items-center justify-center text-[10px] font-black shadow-sm">
                {msg.unread}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

const ProfileScreen = ({ onLogout }: { onLogout: () => void }) => {
  return (
    <div className="flex flex-col min-h-full pb-8">
      <div className="bg-gradient-to-r from-[#0A4D2E] to-[#0D6B3F] text-white px-6 pt-16 pb-24 relative rounded-b-[40px] z-10 shadow-md">
        <div className="absolute inset-0 overflow-hidden rounded-b-[40px]">
           <div className="absolute top-10 left-10 w-40 h-40 bg-[#C9963F]/10 rounded-full blur-[40px]"></div>
           <div className="absolute bottom-0 right-0 w-60 h-60 bg-white/5 rounded-full blur-[50px]"></div>
        </div>
        
        <div className="flex flex-col items-center relative z-10">
          <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center p-1 shadow-[0_8px_30px_rgba(0,0,0,0.15)] relative border-4 border-[#0A4D2E]/20">
            <div className="w-full h-full bg-gradient-to-b from-gray-50 to-gray-200 rounded-full flex items-center justify-center overflow-hidden">
              <User size={40} className="text-gray-400" />
            </div>
            <div className="absolute bottom-0 right-0 w-7 h-7 bg-[#C9963F] rounded-full flex items-center justify-center border-2 border-white shadow-sm">
              <CheckCircle2 size={14} className="text-white" strokeWidth={3} />
            </div>
          </div>
          <h2 className="text-2xl font-bold mt-4">ريان أبوطالب</h2>
          <span className="bg-white/10 backdrop-blur-md px-4 py-1.5 rounded-full text-[11px] font-bold mt-2 border border-white/20 shadow-sm flex items-center gap-1.5">
            <ShieldCheck size={14} className="text-[#C9963F]" />
            مدير النظام | الإدارة الفنية
          </span>
        </div>
      </div>

      <div className="px-6 -mt-12 z-20 space-y-4">
        <div className="bg-white rounded-[24px] shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-gray-100 p-2 divide-y divide-gray-50">
          {[
            { label: 'البيانات الشخصية', icon: <User size={18} /> },
            { label: 'كشف الراتب', icon: <FileText size={18} /> },
            { label: 'التقييم السنوي', icon: <CheckCircle2 size={18} /> },
            { label: 'الإعدادات', icon: <Settings size={18} /> },
          ].map((item, i) => (
            <button key={i} className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors group">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-[#F4F7F5] text-[#0A4D2E] rounded-xl flex items-center justify-center group-hover:bg-[#0A4D2E] group-hover:text-white transition-colors">
                  {item.icon}
                </div>
                <span className="font-bold text-[13px] text-gray-800">{item.label}</span>
              </div>
              <ChevronRight size={18} className="text-gray-400" />
            </button>
          ))}
        </div>

        <button 
          onClick={onLogout}
          className="w-full bg-white rounded-[20px] shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-red-100 p-4 flex items-center justify-center gap-2 text-red-600 font-bold hover:bg-red-50 active:scale-[0.98] transition-all"
        >
          <LogOut size={20} className="rotate-180" />
          <span>تسجيل الخروج</span>
        </button>
      </div>
    </div>
  );
};

const TabBar = ({ activeTab, onTabChange }: { activeTab: string, onTabChange: (tab: string) => void }) => {
  const tabs = [
    { id: 'home', label: 'الرئيسية', icon: Home },
    { id: 'schedule', label: 'جدول', icon: CalendarDays },
    { id: 'vacations', label: 'إجازات', icon: Plane },
    { id: 'messages', label: 'رسائل', icon: MessageCircle, badge: 2 },
    { id: 'profile', label: 'ملفي', icon: User },
  ];

  return (
    <div className="w-full h-[84px] bg-white/95 backdrop-blur-lg shadow-[0_-10px_40px_rgba(0,0,0,0.06)] flex justify-around items-start px-2 pt-3 pb-8 shrink-0 z-50 rounded-t-[32px] border-t border-gray-100">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        
        return (
          <button 
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className="flex flex-col items-center justify-center gap-1.5 w-16 relative"
          >
            {isActive && (
              <div className="absolute -top-3 w-8 h-1 bg-[#0A4D2E] rounded-b-full shadow-[0_2px_8px_rgba(10,77,46,0.5)]"></div>
            )}
            <div className="relative mt-1">
              <div className={`transition-all duration-300 ${isActive ? 'text-[#0A4D2E] -translate-y-1' : 'text-gray-400 hover:text-gray-600'}`}>
                <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
              </div>
              {tab.badge && (
                <div className={`absolute -top-1.5 -right-2.5 w-4 h-4 bg-red-500 rounded-full border-2 border-white flex items-center justify-center transition-transform duration-300 ${isActive ? '-translate-y-1' : ''}`}>
                  <span className="text-white text-[9px] font-black leading-none mt-0.5">{tab.badge}</span>
                </div>
              )}
            </div>
            <span className={`text-[10px] transition-all duration-300 ${isActive ? 'text-[#0A4D2E] font-black' : 'text-gray-400 font-bold'}`}>
              {tab.label}
            </span>
          </button>
        );
      })}
    </div>
  );
};
