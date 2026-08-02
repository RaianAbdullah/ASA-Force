import React, { useState } from 'react';
import { 
  Home, CalendarDays, Plane, MessageCircle, UserCircle,
  Bell, ChevronLeft, LogOut, Clock, Plus,
  CheckCircle, FileText, Lock, User
} from 'lucide-react';

export default function BoldGeometric() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [activeTab, setActiveTab] = useState('home');

  // Status Bar
  const StatusBar = () => (
    <div className="flex justify-between items-center px-4 py-2 bg-white border-b-2 border-black text-xs font-bold font-mono z-50 relative">
      <span>9:41</span>
      <div className="flex gap-1 items-center">
        <div className="w-4 h-3 bg-black"></div>
        <div className="w-3 h-3 bg-black rounded-full"></div>
        <div className="w-5 h-2 bg-black"></div>
      </div>
    </div>
  );

  // Login Screen
  if (!isLoggedIn) {
    return (
      <div dir="rtl" className="w-full h-[900px] overflow-hidden flex flex-col bg-white text-black font-sans selection:bg-[#0A4D2E] selection:text-white relative">
        <StatusBar />
        <div className="flex-1 flex flex-col justify-center px-6 relative z-10 bg-white">
          {/* Decorative geometric shapes */}
          <div className="absolute top-10 right-0 w-24 h-6 bg-[#C9963F] border-y-2 border-l-2 border-black"></div>
          <div className="absolute top-32 left-10 w-4 h-4 bg-black"></div>
          <div className="absolute bottom-20 right-10 w-6 h-6 border-2 border-black rotate-45"></div>
          
          <div className="mb-12 relative z-10">
            <h1 className="text-6xl font-black mb-2 tracking-tighter leading-tight">بوابة<br/>الموظفين.</h1>
            <div className="w-20 h-3 bg-[#0A4D2E] border-2 border-black mt-4"></div>
          </div>

          <div className="space-y-6 relative z-10">
            <div>
              <label className="block text-xl font-bold mb-2">رقم الهوية</label>
              <div className="relative">
                <User className="absolute right-4 top-1/2 -translate-y-1/2 w-6 h-6" />
                <input 
                  type="text" 
                  defaultValue="1029384756"
                  className="w-full bg-white border-2 border-black h-16 pr-12 pl-4 text-xl font-bold focus:outline-none focus:ring-0 shadow-[4px_4px_0_0_#000]" 
                />
              </div>
            </div>
            
            <div>
              <label className="block text-xl font-bold mb-2">كلمة المرور</label>
              <div className="relative">
                <Lock className="absolute right-4 top-1/2 -translate-y-1/2 w-6 h-6" />
                <input 
                  type="password" 
                  defaultValue="********"
                  className="w-full bg-white border-2 border-black h-16 pr-12 pl-4 text-xl font-bold focus:outline-none focus:ring-0 shadow-[4px_4px_0_0_#000]" 
                />
              </div>
            </div>

            <button 
              onClick={() => setIsLoggedIn(true)}
              className="w-full h-16 bg-[#0A4D2E] text-white text-2xl font-black border-2 border-black shadow-[6px_6px_0_0_#000] mt-8 hover:translate-y-1 hover:shadow-[4px_4px_0_0_#000] transition-all active:translate-y-2 active:shadow-none"
            >
              تسجيل الدخول
            </button>
          </div>
          
          <div className="absolute bottom-0 left-0 w-40 h-40 bg-[#C9963F] border-t-2 border-r-2 border-black z-0"></div>
          <div className="absolute bottom-8 left-8 w-20 h-20 bg-[#0A4D2E] border-2 border-black z-0"></div>
        </div>
      </div>
    );
  }

  const TopNav = ({ title }: { title: string }) => (
    <div className="bg-[#0A4D2E] text-white pt-10 pb-6 px-6 border-b-2 border-black relative z-20">
      <div className="flex justify-between items-end">
        <h1 className="text-4xl font-black tracking-tighter relative z-10">{title}</h1>
        <button className="w-12 h-12 bg-white text-black border-2 border-black shadow-[4px_4px_0_0_#000] flex items-center justify-center relative z-10 active:translate-y-1 active:shadow-none transition-all">
          <Bell className="w-6 h-6" />
        </button>
      </div>
      <div className="absolute top-0 right-12 w-16 h-32 bg-[#C9963F] border-x-2 border-b-2 border-black z-0"></div>
    </div>
  );

  const renderHome = () => (
    <div className="flex-1 overflow-y-auto pb-28 bg-white relative">
      <div className="p-6 space-y-8">
        
        {/* Date Block */}
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 bg-[#C9963F] border-2 border-black shadow-[4px_4px_0_0_#000] flex flex-col items-center justify-center font-black">
            <span className="text-3xl leading-none">٢٢</span>
            <span className="text-sm mt-1">يوليو</span>
          </div>
          <div>
            <h2 className="text-3xl font-black">الأربعاء</h2>
            <p className="text-xl font-bold text-gray-700">٢٠٢٦</p>
          </div>
        </div>

        {/* Check-in Card */}
        <div className="bg-white border-2 border-black shadow-[6px_6px_0_0_#000] p-6 relative overflow-hidden">
          <div className="absolute -right-6 -top-6 w-24 h-24 bg-[#0A4D2E] border-2 border-black rotate-45"></div>
          
          <h3 className="text-4xl font-black mb-6 relative z-10 tracking-tighter">تسجيل<br/>الحضور</h3>
          
          <div className="flex justify-between items-center mb-8 relative z-10">
            <div>
              <p className="text-sm font-bold uppercase tracking-widest text-gray-500 mb-1">الوردية الحالية</p>
              <p className="text-3xl font-black">٨:٠٠ ص - ٤:٠٠ م</p>
            </div>
            <Clock className="w-12 h-12" />
          </div>

          <button className="w-full h-16 bg-[#C9963F] text-black text-2xl font-black border-2 border-black shadow-[4px_4px_0_0_#000] hover:translate-y-1 hover:shadow-[2px_2px_0_0_#000] transition-all active:translate-y-2 active:shadow-none flex items-center justify-center gap-2">
            <CheckCircle className="w-7 h-7" />
            حاضر
          </button>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="border-2 border-black p-4 shadow-[4px_4px_0_0_#000] bg-white">
            <h4 className="text-xl font-bold mb-2">أيام الحضور</h4>
            <p className="text-5xl font-black text-[#0A4D2E]">١٨</p>
          </div>
          <div className="border-2 border-black p-4 shadow-[4px_4px_0_0_#000] bg-gray-100">
            <h4 className="text-xl font-bold mb-2">التأخير</h4>
            <p className="text-5xl font-black">٢</p>
          </div>
        </div>

      </div>
    </div>
  );

  const renderSchedule = () => (
    <div className="flex-1 overflow-y-auto pb-28 bg-white p-6 space-y-6">
      <div className="border-2 border-black shadow-[6px_6px_0_0_#000] p-6 bg-[#0A4D2E] text-white relative">
        <div className="absolute top-0 right-0 w-4 h-full bg-[#C9963F] border-l-2 border-black"></div>
        <h2 className="text-3xl font-black mb-6 mr-4 tracking-tighter">وردية هذا الأسبوع</h2>
        
        <div className="space-y-4 mr-4">
          <div className="flex justify-between border-b-2 border-white pb-2">
            <span className="text-xl font-bold">بداية الوردية</span>
            <span className="text-2xl font-black">٨:٠٠ ص</span>
          </div>
          <div className="flex justify-between border-b-2 border-white pb-2">
            <span className="text-xl font-bold">نهاية الوردية</span>
            <span className="text-2xl font-black">٤:٠٠ م</span>
          </div>
        </div>
      </div>

      <div className="space-y-4 pt-4">
        <h3 className="text-3xl font-black tracking-tighter">أيام العمل</h3>
        
        {['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'].map((day, i) => (
          <div key={day} className={`flex justify-between items-center p-4 border-2 border-black ${i === 3 ? 'bg-[#C9963F] shadow-[4px_4px_0_0_#000]' : 'bg-white'}`}>
            <span className="text-2xl font-bold">{day}</span>
            <span className="text-xl font-bold">{i === 3 ? 'اليوم' : '٨:٠٠ - ٤:٠٠'}</span>
          </div>
        ))}
        
        {['الجمعة', 'السبت'].map((day) => (
          <div key={day} className="flex justify-between items-center p-4 border-2 border-gray-300 text-gray-500 bg-gray-50">
            <span className="text-2xl font-bold">{day}</span>
            <span className="text-xl font-bold">راحة</span>
          </div>
        ))}
      </div>
    </div>
  );

  const renderVacations = () => (
    <div className="flex-1 overflow-y-auto pb-28 bg-white p-6 relative">
      <div className="space-y-6">
        
        <div className="border-2 border-black p-5 shadow-[6px_6px_0_0_#000] relative bg-white">
          <div className="absolute top-0 right-0 px-4 py-1 bg-[#C9963F] border-b-2 border-l-2 border-black font-bold text-black">
            مرفوعة
          </div>
          <h3 className="text-3xl font-black mt-6 mb-2">إجازة اعتيادية</h3>
          <p className="text-xl font-bold text-gray-600 mb-4">٢٥ يوليو - ٢٨ يوليو ٢٠٢٦</p>
          <div className="h-2 w-full bg-black"></div>
        </div>

        <div className="border-2 border-black p-5 shadow-[6px_6px_0_0_#000] relative bg-gray-50">
          <div className="absolute top-0 right-0 px-4 py-1 bg-[#0A4D2E] text-white border-b-2 border-l-2 border-black font-bold">
            مقبولة
          </div>
          <h3 className="text-3xl font-black mt-6 mb-2">إجازة مرضية</h3>
          <p className="text-xl font-bold text-gray-600 mb-4">١٠ مايو - ١٢ مايو ٢٠٢٦</p>
          <div className="h-2 w-full bg-black"></div>
        </div>

      </div>

      {/* FAB */}
      <button className="absolute bottom-32 left-6 w-16 h-16 bg-[#0A4D2E] text-white border-2 border-black shadow-[6px_6px_0_0_#000] flex items-center justify-center hover:translate-y-1 hover:shadow-[4px_4px_0_0_#000] active:translate-y-2 active:shadow-none transition-all z-20">
        <Plus className="w-8 h-8" />
      </button>
    </div>
  );

  const renderMessages = () => (
    <div className="flex-1 overflow-y-auto pb-28 bg-white p-6 space-y-4">
      {[
        { name: 'أحمد سالم', role: 'مدير الموارد البشرية', time: '١٠:٤٢ ص', msg: 'الرجاء مراجعة طلب الإجازة الأخير' },
        { name: 'فاطمة عبدالله', role: 'قسم تقنية المعلومات', time: 'أمس', msg: 'تم تحديث صلاحيات النظام بنجاح' },
        { name: 'خالد سعيد', role: 'شؤون الموظفين', time: 'الإثنين', msg: 'تذكير: اجتماع التقييم السنوي غداً' },
      ].map((msg, i) => (
        <div key={i} className={`border-2 border-black p-4 flex gap-4 ${i === 0 ? 'shadow-[4px_4px_0_0_#000] bg-white' : 'bg-gray-50'}`}>
          <div className={`w-14 h-14 border-2 border-black flex items-center justify-center flex-shrink-0 ${i === 0 ? 'bg-[#C9963F]' : 'bg-gray-200'}`}>
            <User className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <div className="flex justify-between items-start mb-1">
              <h4 className="text-2xl font-black">{msg.name}</h4>
              <span className="text-xs font-bold bg-black text-white px-2 py-1">{msg.time}</span>
            </div>
            <p className="text-sm font-bold text-gray-500 mb-2">{msg.role}</p>
            <p className="text-lg font-bold line-clamp-1">{msg.msg}</p>
          </div>
        </div>
      ))}
    </div>
  );

  const renderProfile = () => (
    <div className="flex-1 overflow-y-auto pb-28 bg-white p-6">
      
      <div className="border-2 border-black p-6 shadow-[6px_6px_0_0_#000] text-center mb-8 relative bg-white">
        <div className="absolute top-0 right-0 w-8 h-8 bg-[#0A4D2E] border-b-2 border-l-2 border-black"></div>
        <div className="absolute bottom-0 left-0 w-8 h-8 bg-[#C9963F] border-t-2 border-r-2 border-black"></div>
        
        <div className="w-32 h-32 mx-auto border-2 border-black shadow-[4px_4px_0_0_#000] mb-6 overflow-hidden bg-gray-100 flex items-center justify-center">
          <User className="w-16 h-16 text-gray-400" />
        </div>
        
        <h2 className="text-4xl font-black mb-2 tracking-tighter">ريان أبوطالب</h2>
        <div className="inline-block bg-[#0A4D2E] text-white px-4 py-2 text-xl font-bold border-2 border-black mb-4">
          مدير النظام
        </div>
        <p className="text-xl font-bold border-t-2 border-black pt-4 mt-2">الإدارة الفنية</p>
      </div>

      <div className="space-y-4">
        {[
          { icon: FileText, label: 'البيانات الشخصية' },
          { icon: Lock, label: 'تغيير كلمة المرور' },
        ].map((item, i) => (
          <button key={i} className="w-full flex items-center p-4 border-2 border-black shadow-[4px_4px_0_0_#000] bg-white hover:translate-y-1 hover:shadow-[2px_2px_0_0_#000] active:translate-y-2 active:shadow-none transition-all gap-4">
            <item.icon className="w-8 h-8" />
            <span className="text-2xl font-black flex-1 text-right">{item.label}</span>
            <ChevronLeft className="w-6 h-6" />
          </button>
        ))}

        <button 
          onClick={() => setIsLoggedIn(false)}
          className="w-full flex items-center justify-center p-4 border-2 border-black bg-red-600 text-white mt-8 shadow-[4px_4px_0_0_#000] hover:translate-y-1 hover:shadow-[2px_2px_0_0_#000] active:translate-y-2 active:shadow-none transition-all gap-3"
        >
          <LogOut className="w-7 h-7" />
          <span className="text-2xl font-black">تسجيل الخروج</span>
        </button>
      </div>
    </div>
  );

  return (
    <div dir="rtl" className="w-full h-[900px] overflow-hidden flex flex-col bg-white text-black font-sans selection:bg-[#0A4D2E] selection:text-white relative">
      <StatusBar />
      
      {activeTab === 'home' && <TopNav title="الرئيسية" />}
      {activeTab === 'schedule' && <TopNav title="جدول العمل" />}
      {activeTab === 'vacations' && <TopNav title="الإجازات" />}
      {activeTab === 'messages' && <TopNav title="رسائل" />}
      {activeTab === 'profile' && <TopNav title="الملف الشخصي" />}

      {activeTab === 'home' && renderHome()}
      {activeTab === 'schedule' && renderSchedule()}
      {activeTab === 'vacations' && renderVacations()}
      {activeTab === 'messages' && renderMessages()}
      {activeTab === 'profile' && renderProfile()}

      {/* Tab Bar */}
      <div className="absolute bottom-0 left-0 w-full bg-white border-t-2 border-black pb-8 pt-4 px-2 flex justify-between items-center z-50">
        {[
          { id: 'home', icon: Home, label: 'الرئيسية' },
          { id: 'schedule', icon: CalendarDays, label: 'جدول' },
          { id: 'vacations', icon: Plane, label: 'إجازات' },
          { id: 'messages', icon: MessageCircle, label: 'رسائل' },
          { id: 'profile', icon: UserCircle, label: 'ملفي' },
        ].map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button 
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="flex-1 flex flex-col items-center justify-center gap-1.5 p-2 relative group"
            >
              {isActive && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-10 h-1.5 bg-[#0A4D2E]"></div>
              )}
              <tab.icon className={`w-7 h-7 ${isActive ? 'text-[#0A4D2E]' : 'text-gray-400'}`} strokeWidth={isActive ? 3 : 2} />
              <span className={`text-sm font-black ${isActive ? 'text-black' : 'text-gray-400'}`}>
                {tab.label}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  );
}
