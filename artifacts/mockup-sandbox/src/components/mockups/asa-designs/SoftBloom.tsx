import React, { useState } from 'react';
import { 
  Home, 
  CalendarDays, 
  Palmtree, 
  MessageCircle, 
  User, 
  Fingerprint, 
  Clock, 
  Check, 
  ChevronLeft, 
  MapPin, 
  Briefcase, 
  LogOut, 
  Plus, 
  Search,
  Star
} from 'lucide-react';

export function SoftBloom() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [activeTab, setActiveTab] = useState('home');

  if (!isLoggedIn) {
    return <LoginScreen onLogin={() => setIsLoggedIn(true)} />;
  }

  return (
    <div dir="rtl" className="w-full h-screen overflow-hidden flex flex-col bg-[#F0FAF5] text-[#1A3D2B] font-sans relative">
      {/* Decorative background soft shapes */}
      <div className="absolute top-[-50px] right-[-50px] w-64 h-64 bg-[#E0F2E9] rounded-full blur-3xl opacity-60 pointer-events-none"></div>
      <div className="absolute bottom-[100px] left-[-50px] w-48 h-48 bg-[#E0F2E9] rounded-full blur-2xl opacity-60 pointer-events-none"></div>
      
      {/* Mock Status Bar */}
      <div className="w-full pt-3 pb-2 px-6 flex justify-between items-center text-sm font-medium z-10 relative">
        <span>٩:٤١</span>
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-3 flex items-end gap-0.5">
            <div className="w-1 h-1.5 bg-[#1A3D2B] rounded-sm"></div>
            <div className="w-1 h-2 bg-[#1A3D2B] rounded-sm"></div>
            <div className="w-1 h-2.5 bg-[#1A3D2B] rounded-sm"></div>
            <div className="w-1 h-3 bg-[#1A3D2B] opacity-30 rounded-sm"></div>
          </div>
          <div className="w-3.5 h-3.5 rounded-full border-2 border-[#1A3D2B] flex items-center justify-center">
            <div className="w-1 h-1 bg-[#1A3D2B] rounded-full"></div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 pb-28 z-10 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        {activeTab === 'home' && <HomeScreen />}
        {activeTab === 'schedule' && <ScheduleScreen />}
        {activeTab === 'vacations' && <VacationsScreen />}
        {activeTab === 'messages' && <MessagesScreen />}
        {activeTab === 'profile' && <ProfileScreen onLogout={() => setIsLoggedIn(false)} />}
      </div>

      <TabBar activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>
  );
}

const TabBar = ({ activeTab, setActiveTab }: { activeTab: string, setActiveTab: (t: string) => void }) => {
  const tabs = [
    { id: 'home', icon: Home, label: 'الرئيسية' },
    { id: 'schedule', icon: CalendarDays, label: 'جدول' },
    { id: 'vacations', icon: Palmtree, label: 'إجازات' },
    { id: 'messages', icon: MessageCircle, label: 'رسائل' },
    { id: 'profile', icon: User, label: 'ملفي' },
  ];

  return (
    <div className="absolute bottom-0 w-full bg-[#F0FAF5]/95 backdrop-blur-xl pb-8 pt-4 px-6 flex justify-between items-center z-20 shadow-[0_-10px_40px_rgb(45,122,79,0.05)]">
      {tabs.map(tab => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        return (
          <button 
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className="flex flex-col items-center gap-1.5 transition-all duration-300 relative w-14"
          >
            <Icon 
              size={24} 
              strokeWidth={isActive ? 2.5 : 2} 
              className={`transition-colors ${isActive ? 'text-[#2D7A4F] -translate-y-1' : 'text-[#6B9E7E]'}`}
            />
            <span className={`text-[11px] font-bold transition-colors ${isActive ? 'text-[#2D7A4F]' : 'text-[#6B9E7E]'}`}>
              {tab.label}
            </span>
            {isActive && (
              <div className="absolute -bottom-3 w-1.5 h-1.5 bg-[#2D7A4F] rounded-full"></div>
            )}
          </button>
        );
      })}
    </div>
  );
};

const HomeScreen = () => (
  <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
    <div className="flex justify-between items-center mt-6 mb-8">
      <div>
        <p className="text-[#6B9E7E] text-sm font-medium mb-1">الأربعاء ٢٢ يوليو ٢٠٢٦</p>
        <h1 className="text-2xl font-bold text-[#1A3D2B]">مرحباً، ريان</h1>
      </div>
      <div className="w-14 h-14 bg-[#EAF5F0] text-[#2D7A4F] rounded-full flex items-center justify-center text-xl font-bold border-4 border-white shadow-sm">
        رأ
      </div>
    </div>

    <div className="bg-white rounded-[32px] p-8 shadow-[0_12px_40px_rgb(45,122,79,0.06)] mb-8 flex flex-col items-center relative overflow-hidden">
      <div className="absolute top-[-20px] right-[-20px] w-32 h-32 bg-[#F0FAF5] rounded-full blur-2xl pointer-events-none"></div>
      
      <p className="text-[#6B9E7E] font-medium mb-2 relative z-10 text-sm">وقت الدخول المتوقع: ٨:٠٠ ص</p>
      <h2 className="text-4xl font-bold text-[#1A3D2B] mb-8 relative z-10 tracking-tight">٠٧:٤٥ <span className="text-xl">ص</span></h2>
      
      <button className="w-40 h-40 bg-[#2D7A4F] rounded-full flex flex-col items-center justify-center shadow-[0_12px_32px_rgb(45,122,79,0.25)] text-white hover:scale-105 active:scale-95 transition-all relative z-10 gap-3 border-[6px] border-[#EAF5F0]">
        <Fingerprint size={48} strokeWidth={1.5} />
        <span className="text-lg font-bold">تسجيل الحضور</span>
      </button>
    </div>

    <div className="flex justify-between items-center mb-5 px-1">
      <h3 className="text-lg font-bold text-[#1A3D2B]">سجل الحضور</h3>
      <button className="text-[#2D7A4F] text-sm font-bold bg-[#EAF5F0] px-4 py-1.5 rounded-full">عرض الكل</button>
    </div>

    <div className="bg-white rounded-[24px] p-5 shadow-[0_8px_30px_rgb(45,122,79,0.04)] flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-[16px] bg-[#F0FAF5] text-[#2D7A4F] flex items-center justify-center">
            <Clock size={24} />
          </div>
          <div>
            <p className="font-bold text-[#1A3D2B] mb-0.5">الثلاثاء، ٢١ يوليو</p>
            <p className="text-sm text-[#6B9E7E]">٨:٠٠ ص - ٤:٠٠ م</p>
          </div>
        </div>
        <div className="px-3 py-1.5 bg-[#EAF5F0] text-[#2D7A4F] rounded-full text-xs font-bold flex items-center gap-1.5">
          <Check size={14} strokeWidth={3} />
          مكتمل
        </div>
      </div>
    </div>
  </div>
);

const ScheduleScreen = () => (
  <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
    <h1 className="text-2xl font-bold text-[#1A3D2B] mt-6 mb-8 px-1">جدول العمل</h1>

    <div className="flex justify-between mb-10">
      {['أحد', 'إثنين', 'ثلاثاء', 'أربعاء', 'خميس'].map((day, i) => (
        <div key={day} className={`flex flex-col items-center gap-2 px-3 py-4 rounded-[20px] w-[18%] transition-all ${i === 3 ? 'bg-[#2D7A4F] text-white shadow-[0_8px_20px_rgb(45,122,79,0.3)] scale-105' : 'bg-white text-[#6B9E7E] shadow-[0_4px_20px_rgb(45,122,79,0.04)]'}`}>
          <span className="text-xs font-bold">{day}</span>
          <span className={`text-xl font-bold ${i === 3 ? 'text-white' : 'text-[#1A3D2B]'}`}>{19 + i}</span>
        </div>
      ))}
    </div>

    <div className="bg-white rounded-[32px] p-7 shadow-[0_12px_40px_rgb(45,122,79,0.06)] relative overflow-hidden">
      <div className="absolute top-0 left-0 w-2.5 h-full bg-[#2D7A4F]"></div>
      <h2 className="text-xl font-bold text-[#1A3D2B] mb-2">الوردية الصباحية</h2>
      <p className="text-[#6B9E7E] text-sm mb-8 flex items-center gap-2">
        <MapPin size={18} /> المقر الرئيسي، الرياض
      </p>

      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between p-5 bg-[#F0FAF5] rounded-[24px]">
          <div className="flex items-center gap-4">
            <div className="bg-white p-3 rounded-[16px] text-[#2D7A4F] shadow-sm">
              <Clock size={20} />
            </div>
            <div>
              <p className="text-sm text-[#6B9E7E] mb-1 font-medium">بداية الوردية</p>
              <p className="font-bold text-[#1A3D2B] text-lg">٨:٠٠ ص</p>
            </div>
          </div>
        </div>
        
        <div className="flex items-center justify-between p-5 bg-[#F0FAF5] rounded-[24px]">
          <div className="flex items-center gap-4">
            <div className="bg-white p-3 rounded-[16px] text-[#2D7A4F] shadow-sm">
              <Clock size={20} />
            </div>
            <div>
              <p className="text-sm text-[#6B9E7E] mb-1 font-medium">نهاية الوردية</p>
              <p className="font-bold text-[#1A3D2B] text-lg">٤:٠٠ م</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

const VacationsScreen = () => (
  <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 h-full relative">
    <div className="flex justify-between items-center mt-6 mb-8 px-1">
      <h1 className="text-2xl font-bold text-[#1A3D2B]">الإجازات</h1>
    </div>

    <div className="flex flex-col gap-5">
      <div className="bg-white rounded-[32px] p-6 shadow-[0_8px_30px_rgb(45,122,79,0.05)] relative overflow-hidden">
        <div className="flex justify-between items-start mb-5">
          <div>
            <h3 className="font-bold text-[#1A3D2B] text-xl mb-1.5">إجازة سنوية</h3>
            <p className="text-[#6B9E7E] text-sm font-medium">١٢ أغسطس - ٢٠ أغسطس ٢٠٢٦</p>
          </div>
          <span className="px-4 py-1.5 bg-[#FFF8E6] text-[#C9963F] rounded-full text-xs font-bold">
            مرفوعة
          </span>
        </div>
        <div className="h-[2px] w-full bg-[#F0FAF5] my-4 rounded-full"></div>
        <div className="flex items-center gap-2.5 text-sm font-bold text-[#2D7A4F] bg-[#EAF5F0] w-fit px-4 py-2 rounded-[16px]">
          <Briefcase size={16} />
          <span>الرصيد المتبقي: ٢١ يوم</span>
        </div>
      </div>

      <div className="bg-white rounded-[32px] p-6 shadow-[0_8px_30px_rgb(45,122,79,0.05)] relative overflow-hidden">
        <div className="flex justify-between items-start mb-2">
          <div>
            <h3 className="font-bold text-[#1A3D2B] text-xl mb-1.5">إجازة مرضية</h3>
            <p className="text-[#6B9E7E] text-sm font-medium">١٠ مايو - ١٢ مايو ٢٠٢٦</p>
          </div>
          <span className="px-4 py-1.5 bg-[#EAF5F0] text-[#2D7A4F] rounded-full text-xs font-bold">
            مقبولة
          </span>
        </div>
      </div>
    </div>

    <div className="fixed bottom-28 left-6 z-30">
      <button className="w-16 h-16 bg-[#2D7A4F] text-white rounded-[24px] flex items-center justify-center shadow-[0_8px_24px_rgb(45,122,79,0.3)] hover:scale-105 active:scale-95 transition-all">
        <Plus size={32} strokeWidth={2} />
      </button>
    </div>
  </div>
);

const MessagesScreen = () => (
  <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
    <div className="flex justify-between items-center mt-6 mb-8 px-1">
      <h1 className="text-2xl font-bold text-[#1A3D2B]">الرسائل</h1>
      <button className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm text-[#2D7A4F]">
        <Search size={22} />
      </button>
    </div>

    <div className="flex flex-col gap-4">
      {[
        { name: 'أحمد عبدالله', role: 'مدير الموارد البشرية', msg: 'تم اعتماد طلب الإجازة الخاص بك.', time: '١٠:٣٠ ص', unread: true },
        { name: 'فاطمة سعد', role: 'قسم الدعم الفني', msg: 'هل يمكنك تأكيد استلام العهدة؟', time: 'أمس', unread: false },
        { name: 'سالم الشمري', role: 'رئيس القسم', msg: 'شكراً لجهودك في مشروع الشهر الماضي. لقد كان عملاً رائعاً.', time: 'الإثنين', unread: false },
      ].map((chat, i) => (
        <div key={i} className="bg-white rounded-[28px] p-5 shadow-[0_8px_30px_rgb(45,122,79,0.04)] flex items-center gap-4 hover:bg-[#fafdfb] transition-colors cursor-pointer">
          <div className="w-14 h-14 bg-[#EAF5F0] text-[#2D7A4F] rounded-full flex items-center justify-center text-xl font-bold flex-shrink-0 border-2 border-white shadow-sm">
            {chat.name.split(' ').map(n => n[0]).join('')}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-center mb-1.5">
              <h3 className="font-bold text-[#1A3D2B] text-lg">{chat.name}</h3>
              <span className={`text-xs font-bold ${chat.unread ? 'text-[#2D7A4F]' : 'text-[#6B9E7E]'}`}>{chat.time}</span>
            </div>
            <p className={`text-sm truncate ${chat.unread ? 'text-[#1A3D2B] font-bold' : 'text-[#6B9E7E] font-medium'}`}>{chat.msg}</p>
          </div>
          {chat.unread && <div className="w-3 h-3 bg-[#2D7A4F] rounded-full flex-shrink-0"></div>}
        </div>
      ))}
    </div>
  </div>
);

const ProfileScreen = ({ onLogout }: { onLogout: () => void }) => (
  <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
    <div className="flex flex-col items-center mt-12 mb-10 relative">
      <div className="w-28 h-28 bg-[#EAF5F0] text-[#2D7A4F] rounded-[36px] flex items-center justify-center text-4xl font-bold border-4 border-white shadow-[0_12px_40px_rgb(45,122,79,0.1)] mb-5 rotate-3">
        <div className="-rotate-3">رأ</div>
      </div>
      <h2 className="text-2xl font-bold text-[#1A3D2B] mb-1.5">ريان أبوطالب</h2>
      <p className="text-[#6B9E7E] font-medium mb-4">الإدارة الفنية</p>
      
      <div className="px-5 py-2 bg-[#FFF8E6] text-[#C9963F] rounded-full text-sm font-bold flex items-center gap-2">
        <Star size={16} fill="currentColor" />
        مدير النظام
      </div>
    </div>

    <div className="bg-white rounded-[32px] p-3 shadow-[0_8px_30px_rgb(45,122,79,0.05)] flex flex-col mb-6">
      {[
        { label: 'المعلومات الشخصية', icon: User },
        { label: 'الإعدادات', icon: Briefcase },
        { label: 'الدعم والمساعدة', icon: MessageCircle },
      ].map((item, i) => (
        <button key={i} className="flex items-center justify-between p-4 hover:bg-[#F0FAF5] rounded-[24px] transition-colors w-full">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-[16px] bg-[#F0FAF5] text-[#2D7A4F] flex items-center justify-center">
              <item.icon size={20} />
            </div>
            <span className="font-bold text-[#1A3D2B] text-lg">{item.label}</span>
          </div>
          <ChevronLeft size={20} className="text-[#6B9E7E]" />
        </button>
      ))}
    </div>

    <button onClick={onLogout} className="w-full bg-white text-[#d64545] rounded-[28px] py-5 flex items-center justify-center gap-2 font-bold text-lg shadow-[0_8px_30px_rgb(45,122,79,0.05)] hover:bg-[#fff5f5] transition-colors">
      <LogOut size={22} />
      تسجيل الخروج
    </button>
  </div>
);

const LoginScreen = ({ onLogin }: { onLogin: () => void }) => (
  <div dir="rtl" className="w-full h-screen overflow-hidden flex flex-col bg-[#F0FAF5] text-[#1A3D2B] font-sans relative px-6">
    {/* Decorative soft backgrounds */}
    <div className="absolute top-[-100px] right-[-50px] w-80 h-80 bg-[#E0F2E9] rounded-full blur-3xl opacity-80 pointer-events-none"></div>
    <div className="absolute bottom-[-50px] left-[-100px] w-96 h-96 bg-[#E0F2E9] rounded-full blur-3xl opacity-80 pointer-events-none"></div>

    {/* Mock Status Bar */}
    <div className="w-full pt-3 pb-2 flex justify-between items-center text-sm font-medium z-10 relative">
      <span>٩:٤١</span>
      <div className="flex items-center gap-1.5">
        <div className="w-4 h-3 flex items-end gap-0.5">
          <div className="w-1 h-1.5 bg-[#1A3D2B] rounded-sm"></div>
          <div className="w-1 h-2 bg-[#1A3D2B] rounded-sm"></div>
          <div className="w-1 h-2.5 bg-[#1A3D2B] rounded-sm"></div>
          <div className="w-1 h-3 bg-[#1A3D2B] opacity-30 rounded-sm"></div>
        </div>
        <div className="w-3.5 h-3.5 rounded-full border-2 border-[#1A3D2B] flex items-center justify-center">
          <div className="w-1 h-1 bg-[#1A3D2B] rounded-full"></div>
        </div>
      </div>
    </div>

    <div className="flex-1 flex flex-col justify-center z-10 animate-in fade-in duration-700 pb-10">
      <div className="w-24 h-24 bg-white rounded-[32px] shadow-[0_12px_40px_rgb(45,122,79,0.1)] flex items-center justify-center mb-10 mx-auto rotate-12">
        <Palmtree size={48} className="text-[#2D7A4F] -rotate-12" />
      </div>
      
      <h1 className="text-4xl font-bold text-center mb-3">مرحباً بك</h1>
      <p className="text-[#6B9E7E] text-center mb-12 text-lg font-medium">بوابة الموظفين الحكومية</p>

      <div className="bg-white p-6 rounded-[36px] shadow-[0_12px_40px_rgb(45,122,79,0.08)] flex flex-col gap-6">
        <div>
          <label className="block text-sm font-bold text-[#1A3D2B] mb-2.5 px-2">رقم الهوية / الإقامة</label>
          <input 
            type="text" 
            placeholder="١٠٠٠٠٠٠٠٠٠"
            className="w-full bg-[#F0FAF5] text-[#1A3D2B] placeholder:text-[#6B9E7E]/50 px-6 py-4 rounded-[20px] border-none focus:ring-2 focus:ring-[#2D7A4F] outline-none text-left font-bold text-lg" 
            dir="ltr"
          />
        </div>
        
        <div>
          <label className="block text-sm font-bold text-[#1A3D2B] mb-2.5 px-2">كلمة المرور</label>
          <input 
            type="password" 
            placeholder="••••••••"
            className="w-full bg-[#F0FAF5] text-[#1A3D2B] placeholder:text-[#6B9E7E]/50 px-6 py-4 rounded-[20px] border-none focus:ring-2 focus:ring-[#2D7A4F] outline-none text-left tracking-widest text-lg"
            dir="ltr" 
          />
        </div>

        <button className="text-sm font-bold text-[#2D7A4F] text-right mt-[-4px] px-2 w-fit">
          نسيت كلمة المرور؟
        </button>

        <button 
          onClick={onLogin}
          className="w-full bg-[#2D7A4F] text-white rounded-[24px] py-5 flex items-center justify-center font-bold text-xl hover:bg-[#23633e] transition-colors mt-2 shadow-[0_8px_24px_rgb(45,122,79,0.3)]"
        >
          تسجيل الدخول
        </button>
      </div>

      <div className="mt-10 flex justify-center items-center gap-4 text-sm font-bold text-[#6B9E7E]">
        <div className="h-[2px] flex-1 bg-[#6B9E7E]/10 rounded-full"></div>
        <span>أو الدخول عبر</span>
        <div className="h-[2px] flex-1 bg-[#6B9E7E]/10 rounded-full"></div>
      </div>

      <button className="mt-8 w-full bg-white text-[#1A3D2B] rounded-[24px] py-5 flex items-center justify-center font-bold text-lg hover:bg-[#f9f9f9] transition-colors shadow-[0_8px_30px_rgb(45,122,79,0.06)] gap-3">
        <Fingerprint size={28} className="text-[#2D7A4F]" />
        النفاذ الوطني الموحد
      </button>
    </div>
  </div>
);

export default SoftBloom;
