import React, { useState } from 'react';
import { 
  Home, 
  CalendarDays, 
  Plane, 
  MessageSquare, 
  User, 
  Wifi, 
  Battery, 
  Signal, 
  Bell, 
  Search, 
  ChevronRight, 
  Clock, 
  MapPin,
  CheckCircle,
  Plus,
  Send,
  LogOut,
  Settings,
  Shield,
  FileText
} from 'lucide-react';

export default function MidnightGlass() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [activeTab, setActiveTab] = useState('home'); // home, schedule, vacations, messages, profile

  // --- Components ---

  const StatusBar = () => (
    <div className="w-full flex justify-between items-center px-6 pt-4 pb-2 text-white/80 text-xs font-medium z-50">
      <span>9:41</span>
      <div className="flex items-center gap-1.5" dir="ltr">
        <Signal size={14} />
        <Wifi size={14} />
        <Battery size={16} />
      </div>
    </div>
  );

  const Header = ({ title, showBell = false }: { title: string, showBell?: boolean }) => (
    <div className="flex justify-between items-center px-6 py-4">
      <h1 className="text-xl font-bold text-white tracking-tight">{title}</h1>
      {showBell && (
        <button className="relative w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white backdrop-blur-md">
          <Bell size={20} />
          <span className="absolute top-2 right-2 w-2 h-2 bg-[#00E676] rounded-full shadow-[0_0_8px_#00E676]"></span>
        </button>
      )}
    </div>
  );

  const TabBar = () => {
    const tabs = [
      { id: 'profile', icon: User, label: 'ملفي' },
      { id: 'messages', icon: MessageSquare, label: 'رسائل' },
      { id: 'vacations', icon: Plane, label: 'إجازات' },
      { id: 'schedule', icon: CalendarDays, label: 'جدول' },
      { id: 'home', icon: Home, label: 'الرئيسية' },
    ];

    return (
      <div className="absolute bottom-0 left-0 w-full h-[88px] bg-black/60 backdrop-blur-xl border-t border-white/10 flex justify-around items-center px-2 pb-6 pt-2 z-50">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-col items-center justify-center w-16 gap-1.5 transition-all duration-300 ${
                isActive ? 'text-[#00E676]' : 'text-white/40'
              }`}
            >
              <div className={`relative flex items-center justify-center w-10 h-10 rounded-xl transition-all duration-300 ${
                isActive ? 'bg-[#00E676]/10' : 'bg-transparent'
              }`}>
                <Icon size={22} className={isActive ? 'drop-shadow-[0_0_8px_rgba(0,230,118,0.5)]' : ''} />
              </div>
              <span className={`text-[10px] font-medium ${isActive ? 'text-[#00E676]' : 'text-white/40'}`}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    );
  };

  // --- Screens ---

  const LoginScreen = () => (
    <div className="flex-1 flex flex-col items-center justify-center px-8 relative z-10 w-full">
      <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-[#00E676]/20 to-transparent border border-[#00E676]/30 flex items-center justify-center mb-8 shadow-[0_0_30px_rgba(0,230,118,0.15)] backdrop-blur-md">
        <Shield size={40} className="text-[#00E676] drop-shadow-[0_0_12px_rgba(0,230,118,0.6)]" />
      </div>
      
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold text-white mb-3">أهلاً بك مجدداً</h1>
        <p className="text-white/55 text-sm">قم بتسجيل الدخول للوصول إلى بوابة الموظفين</p>
      </div>

      <div className="w-full space-y-4">
        <div className="space-y-1.5">
          <label className="text-xs text-white/60 font-medium px-1">رقم الهوية / الإقامة</label>
          <div className="w-full h-14 bg-white/5 border border-white/10 rounded-2xl px-4 flex items-center backdrop-blur-md focus-within:border-[#00E676]/50 focus-within:bg-[#00E676]/5 transition-all">
            <User size={20} className="text-white/40 ml-3" />
            <input 
              type="text" 
              placeholder="أدخل رقم الهوية" 
              className="bg-transparent border-none outline-none text-white w-full text-left placeholder:text-white/20 placeholder:text-right" 
              dir="rtl"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs text-white/60 font-medium px-1">كلمة المرور</label>
          <div className="w-full h-14 bg-white/5 border border-white/10 rounded-2xl px-4 flex items-center backdrop-blur-md focus-within:border-[#00E676]/50 focus-within:bg-[#00E676]/5 transition-all">
            <Search size={20} className="text-white/40 ml-3" />
            <input 
              type="password" 
              placeholder="••••••••" 
              className="bg-transparent border-none outline-none text-white w-full text-left placeholder:text-white/20 placeholder:text-right tracking-[0.2em]" 
              dir="ltr"
            />
          </div>
        </div>
      </div>

      <button 
        onClick={() => setIsLoggedIn(true)}
        className="w-full h-14 mt-10 rounded-2xl bg-gradient-to-l from-[#00E676] to-[#00BFA5] text-[#0A0F0D] font-bold text-lg shadow-[0_0_20px_rgba(0,230,118,0.4)] flex items-center justify-center gap-2 hover:shadow-[0_0_30px_rgba(0,230,118,0.6)] transition-all"
      >
        <span>تسجيل الدخول</span>
        <ChevronRight size={20} />
      </button>
      
      <div className="mt-8 text-center text-sm text-[#00E676] font-medium opacity-80">
        نسيت كلمة المرور؟
      </div>
    </div>
  );

  const HomeScreen = () => (
    <div className="flex-1 overflow-y-auto pb-24 scrollbar-hide">
      <Header title="الرئيسية" showBell={true} />
      
      <div className="px-6 space-y-6">
        {/* User greeting */}
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-white/10 to-white/5 border border-white/10 p-0.5 overflow-hidden">
            <img src="https://i.pravatar.cc/150?u=a042581f4e29026704d" alt="User" className="w-full h-full rounded-full object-cover" />
          </div>
          <div>
            <div className="text-sm text-white/55 mb-0.5">صباح الخير،</div>
            <div className="text-lg font-bold text-white">ريان أبوطالب</div>
          </div>
        </div>

        {/* Date */}
        <div className="flex items-center gap-2 text-white/70 bg-white/5 px-4 py-2.5 rounded-xl border border-white/10 w-fit backdrop-blur-md">
          <CalendarDays size={16} className="text-[#00E676]" />
          <span className="text-sm font-medium">الأربعاء ٢٢ يوليو ٢٠٢٦</span>
        </div>

        {/* Big Check-in Card */}
        <div className="relative w-full rounded-3xl bg-white/5 border border-white/10 backdrop-blur-lg p-6 overflow-hidden">
          {/* Decorative glow */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#00E676]/10 rounded-full blur-[40px] pointer-events-none"></div>
          
          <div className="flex justify-between items-start mb-8 relative z-10">
            <div>
              <div className="text-white/60 text-sm mb-1">الوردية الحالية</div>
              <div className="text-2xl font-bold text-white tracking-tight">٠٨:٠٠ <span className="text-base text-white/55 font-normal">ص</span> - ٠٤:٠٠ <span className="text-base text-white/55 font-normal">م</span></div>
            </div>
            <div className="bg-white/10 border border-white/10 px-3 py-1 rounded-full text-xs font-medium text-[#00E676] flex items-center gap-1.5 backdrop-blur-md">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00E676] animate-pulse"></span>
              متاح
            </div>
          </div>
          
          <button className="w-full h-16 rounded-2xl bg-gradient-to-l from-[#00E676] to-[#00BFA5] text-[#0A0F0D] font-bold text-lg shadow-[0_0_20px_rgba(0,230,118,0.4)] flex items-center justify-center gap-3 relative z-10">
            <MapPin size={22} />
            <span>تسجيل الحضور</span>
          </button>
        </div>

        {/* Attendance Summary */}
        <div className="pt-2">
          <h2 className="text-lg font-bold text-white mb-4">ملخص الحضور (هذا الأسبوع)</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 backdrop-blur-md flex flex-col justify-center items-center">
              <div className="w-10 h-10 rounded-full bg-[#00E676]/20 text-[#00E676] flex items-center justify-center mb-3">
                <CheckCircle size={20} />
              </div>
              <div className="text-2xl font-bold text-white mb-0.5">١٤</div>
              <div className="text-xs text-white/55">يوم حضور</div>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 backdrop-blur-md flex flex-col justify-center items-center">
              <div className="w-10 h-10 rounded-full bg-[#C9963F]/20 text-[#C9963F] flex items-center justify-center mb-3">
                <Clock size={20} />
              </div>
              <div className="text-2xl font-bold text-white mb-0.5">٣</div>
              <div className="text-xs text-white/55">تأخير (دقائق)</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const ScheduleScreen = () => (
    <div className="flex-1 overflow-y-auto pb-24 scrollbar-hide">
      <Header title="جدول العمل" showBell={true} />
      
      <div className="px-6 space-y-6">
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-6 px-6" dir="rtl">
          {['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'].map((day, i) => (
            <div key={i} className={`flex-shrink-0 w-16 h-20 rounded-2xl flex flex-col items-center justify-center gap-1.5 border transition-all ${
              i === 3 
                ? 'bg-[#00E676]/10 border-[#00E676]/40 shadow-[0_0_15px_rgba(0,230,118,0.15)]' 
                : 'bg-white/5 border-white/10 text-white/60 backdrop-blur-sm'
            }`}>
              <span className={`text-xs ${i === 3 ? 'text-[#00E676]' : 'text-white/40'}`}>{day}</span>
              <span className={`text-lg font-bold ${i === 3 ? 'text-white' : 'text-white/80'}`}>{19 + i}</span>
            </div>
          ))}
        </div>

        <div className="mt-8 space-y-4">
          <div className="w-full bg-white/5 border border-white/10 rounded-3xl p-5 backdrop-blur-md">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-white font-bold text-lg">تفاصيل الوردية</h3>
              <div className="bg-white/10 px-3 py-1.5 rounded-xl border border-white/10 text-white/80 text-sm flex items-center gap-2">
                <CalendarDays size={16} className="text-[#00E676]" />
                الأربعاء
              </div>
            </div>
            
            <div className="space-y-5">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-[#00E676]/10 border border-[#00E676]/20 flex items-center justify-center text-[#00E676]">
                  <Clock size={22} />
                </div>
                <div>
                  <div className="text-white/55 text-xs mb-1">بداية الوردية</div>
                  <div className="text-white font-bold text-xl">٠٨:٠٠ <span className="text-sm font-normal text-white/60">صباحاً</span></div>
                </div>
              </div>
              
              <div className="w-0.5 h-6 bg-white/10 mr-6 -my-2 rounded-full"></div>
              
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white/40">
                  <Clock size={22} />
                </div>
                <div>
                  <div className="text-white/55 text-xs mb-1">نهاية الوردية</div>
                  <div className="text-white font-bold text-xl">٠٤:٠٠ <span className="text-sm font-normal text-white/60">مساءً</span></div>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-5 border-t border-white/10">
              <div className="flex justify-between items-center text-sm">
                <span className="text-white/55">المدة الإجمالية</span>
                <span className="text-[#00E676] font-bold text-lg">٨ ساعات</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const VacationsScreen = () => (
    <div className="flex-1 overflow-y-auto pb-24 scrollbar-hide relative h-full">
      <Header title="الإجازات" showBell={true} />
      
      <div className="px-6 space-y-4">
        {/* Approved Request */}
        <div className="bg-white/5 border border-white/10 rounded-3xl p-5 backdrop-blur-md">
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-white">
                <Plane size={20} className="transform rotate-45" />
              </div>
              <div>
                <div className="text-white font-bold text-base mb-0.5">إجازة سنوية</div>
                <div className="text-white/55 text-xs">١٢ أغسطس - ٢٦ أغسطس</div>
              </div>
            </div>
            <div className="bg-[#00E676]/10 border border-[#00E676]/30 text-[#00E676] px-3 py-1 rounded-full text-xs font-bold">
              مقبولة
            </div>
          </div>
          <div className="flex justify-between items-center bg-black/20 rounded-2xl p-3 border border-white/5">
            <div className="text-center flex-1 border-l border-white/10">
              <div className="text-white/40 text-[10px] mb-1">المدة</div>
              <div className="text-white font-bold text-sm">١٤ يوم</div>
            </div>
            <div className="text-center flex-1">
              <div className="text-white/40 text-[10px] mb-1">تاريخ الطلب</div>
              <div className="text-white font-bold text-sm">١ أغسطس</div>
            </div>
          </div>
        </div>

        {/* Pending Request */}
        <div className="bg-white/5 border border-white/10 rounded-3xl p-5 backdrop-blur-md">
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-white">
                <FileText size={20} />
              </div>
              <div>
                <div className="text-white font-bold text-base mb-0.5">إجازة مرضية</div>
                <div className="text-white/55 text-xs">٥ سبتمبر - ٦ سبتمبر</div>
              </div>
            </div>
            <div className="bg-[#C9963F]/10 border border-[#C9963F]/30 text-[#C9963F] px-3 py-1 rounded-full text-xs font-bold">
              مرفوعة
            </div>
          </div>
          <div className="flex justify-between items-center bg-black/20 rounded-2xl p-3 border border-white/5">
            <div className="text-center flex-1 border-l border-white/10">
              <div className="text-white/40 text-[10px] mb-1">المدة</div>
              <div className="text-white font-bold text-sm">يومين</div>
            </div>
            <div className="text-center flex-1">
              <div className="text-white/40 text-[10px] mb-1">تاريخ الطلب</div>
              <div className="text-white font-bold text-sm">١ سبتمبر</div>
            </div>
          </div>
        </div>
      </div>

      <button className="absolute bottom-28 left-6 w-14 h-14 bg-[#00E676] rounded-full flex items-center justify-center text-[#0A0F0D] shadow-[0_0_25px_rgba(0,230,118,0.5)] z-40 hover:scale-105 transition-transform">
        <Plus size={24} />
      </button>
    </div>
  );

  const MessagesScreen = () => (
    <div className="flex-1 overflow-y-auto pb-24 scrollbar-hide">
      <Header title="الرسائل" showBell={true} />
      
      <div className="px-6 mb-4">
        <div className="w-full h-12 bg-white/5 border border-white/10 rounded-2xl px-4 flex items-center backdrop-blur-md">
          <Search size={18} className="text-white/40 ml-3" />
          <input 
            type="text" 
            placeholder="البحث في الرسائل..." 
            className="bg-transparent border-none outline-none text-white w-full text-sm placeholder:text-white/30" 
          />
        </div>
      </div>

      <div className="px-6 space-y-3">
        {[
          { name: 'محمد عبدالله', role: 'الموارد البشرية', msg: 'تم الموافقة على طلب الإجازة الخاص بك', time: '١٠:٣٠ ص', unread: 2, avatar: 'https://i.pravatar.cc/150?u=1' },
          { name: 'سارة خالد', role: 'مدير المشروع', msg: 'هل يمكنك إرسال التقرير الأسبوعي؟', time: 'أمس', unread: 0, avatar: 'https://i.pravatar.cc/150?u=2' },
          { name: 'أحمد سعيد', role: 'دعم تقنية المعلومات', msg: 'تم حل المشكلة في النظام', time: 'الإثنين', unread: 0, avatar: 'https://i.pravatar.cc/150?u=3' },
        ].map((chat, i) => (
          <div key={i} className="flex items-center gap-4 bg-white/5 border border-white/10 rounded-3xl p-4 backdrop-blur-sm active:bg-white/10 transition-colors cursor-pointer">
            <div className="relative">
              <img src={chat.avatar} alt={chat.name} className="w-14 h-14 rounded-full border border-white/20 object-cover" />
              {chat.unread > 0 && (
                <div className="absolute top-0 right-0 w-4 h-4 bg-[#00E676] rounded-full border-2 border-[#0A0F0D] flex items-center justify-center text-[#0A0F0D] text-[9px] font-bold">
                  {chat.unread}
                </div>
              )}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-center mb-1">
                <h4 className="text-white font-bold text-sm truncate">{chat.name}</h4>
                <span className={`text-xs ${chat.unread > 0 ? 'text-[#00E676] font-bold' : 'text-white/40'}`}>{chat.time}</span>
              </div>
              <div className="text-[#C9963F] text-[10px] mb-1">{chat.role}</div>
              <p className="text-white/60 text-xs truncate">{chat.msg}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const ProfileScreen = () => (
    <div className="flex-1 overflow-y-auto pb-24 scrollbar-hide">
      <Header title="الملف الشخصي" showBell={true} />
      
      <div className="px-6 flex flex-col items-center mt-4">
        <div className="relative mb-6">
          <div className="w-28 h-28 rounded-full bg-gradient-to-br from-[#00E676]/40 to-transparent border-2 border-[#00E676]/50 p-1 flex items-center justify-center shadow-[0_0_30px_rgba(0,230,118,0.2)]">
            <img src="https://i.pravatar.cc/150?u=a042581f4e29026704d" alt="User" className="w-full h-full rounded-full object-cover" />
          </div>
          <button className="absolute bottom-0 right-0 w-8 h-8 bg-white/10 border border-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white shadow-lg">
            <Settings size={16} />
          </button>
        </div>
        
        <h2 className="text-2xl font-bold text-white mb-1 tracking-tight">ريان أبوطالب</h2>
        
        <div className="flex gap-2 mt-3">
          <div className="bg-[#C9963F]/10 border border-[#C9963F]/30 text-[#C9963F] px-4 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5">
            <Shield size={14} />
            مدير النظام
          </div>
          <div className="bg-white/10 border border-white/10 text-white/80 px-4 py-1.5 rounded-full text-xs flex items-center">
            الإدارة الفنية
          </div>
        </div>

        <div className="w-full mt-10 space-y-3">
          {[
            { icon: User, label: 'المعلومات الشخصية', value: 'تحديث البيانات' },
            { icon: FileText, label: 'مسيرات الرواتب', value: 'عرض التفاصيل' },
            { icon: Shield, label: 'كلمة المرور والأمان', value: 'تغيير' },
            { icon: Bell, label: 'التنبيهات', value: 'تخصيص' },
          ].map((item, i) => (
            <div key={i} className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center justify-between backdrop-blur-sm cursor-pointer active:bg-white/10 transition-colors">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white/70">
                  <item.icon size={20} />
                </div>
                <span className="text-white font-medium text-sm">{item.label}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-white/40 text-xs">{item.value}</span>
                <ChevronRight size={16} className="text-white/30 transform rotate-180" />
              </div>
            </div>
          ))}
          
          <button 
            onClick={() => setIsLoggedIn(false)}
            className="w-full mt-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-2xl p-4 flex items-center justify-center gap-2 font-bold text-sm backdrop-blur-sm hover:bg-red-500/20 transition-colors"
          >
            <LogOut size={18} />
            تسجيل الخروج
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="w-full h-screen overflow-hidden flex flex-col bg-[#0A0F0D] font-sans" dir="rtl" style={{ fontFamily: "system-ui, -apple-system, sans-serif" }}>
      {/* Dynamic Background Effects */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[30%] bg-[#00E676]/5 rounded-full blur-[100px]"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[60%] h-[40%] bg-[#00E676]/3 rounded-full blur-[120px]"></div>
        {/* Subtle noise texture via pseudo element in standard CSS, approximated here via background opacity if we had an image, but clean gradients fit well */}
      </div>

      <div className="relative z-10 flex flex-col h-full w-full">
        <StatusBar />
        
        {!isLoggedIn ? (
          <LoginScreen />
        ) : (
          <>
            {activeTab === 'home' && <HomeScreen />}
            {activeTab === 'schedule' && <ScheduleScreen />}
            {activeTab === 'vacations' && <VacationsScreen />}
            {activeTab === 'messages' && <MessagesScreen />}
            {activeTab === 'profile' && <ProfileScreen />}
            <TabBar />
          </>
        )}
      </div>
    </div>
  );
}
