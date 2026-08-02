import React, { useState } from 'react';
import { 
  Home, 
  Calendar, 
  Palmtree, 
  MessageCircle, 
  User,
  Bell,
  Clock,
  ChevronLeft,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Plus,
  Send,
  LogOut,
  Settings,
  Shield,
  Fingerprint
} from 'lucide-react';

export function AuroraGradient() {
  const [activeTab, setActiveTab] = useState('home');
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Aurora Background Component
  const AuroraBackground = () => (
    <div className="absolute inset-0 z-0 overflow-hidden bg-gradient-to-b from-[#061C12] via-[#0B3D22] to-[#0D4A2A] pointer-events-none">
      <div className="absolute -top-[20%] -left-[10%] w-[70%] h-[50%] rounded-full bg-[#00BFA5] opacity-20 blur-[120px] mix-blend-screen" />
      <div className="absolute top-[30%] -right-[20%] w-[80%] h-[60%] rounded-full bg-[#0B3D22] opacity-50 blur-[100px]" />
      <div className="absolute -bottom-[20%] left-[20%] w-[60%] h-[40%] rounded-full bg-[#00897B] opacity-20 blur-[100px]" />
    </div>
  );

  // Status Bar
  const StatusBar = () => (
    <div className="relative z-50 flex justify-between items-center px-6 pt-4 pb-2 text-white text-sm font-medium">
      <span>9:41</span>
      <div className="flex items-center gap-1.5">
        <div className="w-4 h-4 rounded-full bg-white/20 flex items-center justify-center">
          <div className="w-1.5 h-1.5 rounded-full bg-white" />
        </div>
        <div className="w-4 h-4 rounded-full bg-white/20 flex items-center justify-center">
          <div className="w-2 h-2 rounded-full bg-white" />
        </div>
        <div className="w-6 h-3 rounded-sm border border-white/50 p-[1px]">
          <div className="w-3/4 h-full bg-white rounded-[1px]" />
        </div>
      </div>
    </div>
  );

  // Glass Card
  const GlassCard = ({ children, className = '' }: { children: React.ReactNode, className?: string }) => (
    <div className={`bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl ${className}`}>
      {children}
    </div>
  );

  // Login Screen
  if (!isLoggedIn) {
    return (
      <div dir="rtl" className="relative w-full h-[900px] overflow-hidden flex flex-col bg-[#061C12] font-sans text-white">
        <AuroraBackground />
        <StatusBar />
        
        <div className="relative z-10 flex-1 flex flex-col justify-center px-6 pb-20">
          <div className="flex flex-col items-center mb-12">
            <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-[#00BFA5] to-[#00897B] p-[2px] mb-6 shadow-[0_0_40px_rgba(0,191,165,0.3)]">
              <div className="w-full h-full bg-[#061C12]/80 backdrop-blur-xl rounded-[22px] flex items-center justify-center">
                <Shield className="w-12 h-12 text-[#00BFA5]" />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-white/70 mb-2">
              منصة الموظفين
            </h1>
            <p className="text-white/60 text-center text-sm">
              بوابة الخدمات الذاتية لحكومة الإمارات
            </p>
          </div>

          <GlassCard className="p-6">
            <form onSubmit={(e) => { e.preventDefault(); setIsLoggedIn(true); }} className="space-y-5">
              <div>
                <label className="block text-white/70 text-sm mb-2">رقم الهوية / الرقم الوظيفي</label>
                <div className="relative">
                  <User className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                  <input 
                    type="text" 
                    defaultValue="784-1234-567890-1"
                    className="w-full bg-black/20 border border-white/10 rounded-xl py-3.5 pr-12 pl-4 text-white placeholder-white/30 focus:outline-none focus:border-[#00BFA5]/50 transition-colors"
                    dir="ltr"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-white/70 text-sm mb-2">كلمة المرور</label>
                <div className="relative">
                  <Fingerprint className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                  <input 
                    type="password" 
                    defaultValue="••••••••"
                    className="w-full bg-black/20 border border-white/10 rounded-xl py-3.5 pr-12 pl-4 text-white placeholder-white/30 focus:outline-none focus:border-[#00BFA5]/50 transition-colors"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between mt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <div className="w-5 h-5 rounded border border-[#00BFA5] bg-[#00BFA5]/20 flex items-center justify-center">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#00BFA5]" />
                  </div>
                  <span className="text-sm text-white/70">تذكرني</span>
                </label>
                <button type="button" className="text-sm text-[#00BFA5] hover:text-[#00BFA5]/80">
                  نسيت كلمة المرور؟
                </button>
              </div>

              <button 
                type="submit"
                className="w-full mt-6 bg-gradient-to-r from-[#00BFA5] to-[#00897B] hover:opacity-90 text-white font-medium py-4 rounded-xl shadow-[0_8px_20px_rgba(0,191,165,0.25)] transition-all active:scale-[0.98]"
              >
                تسجيل الدخول
              </button>
            </form>
          </GlassCard>
        </div>
      </div>
    );
  }

  return (
    <div dir="rtl" className="relative w-full h-[900px] overflow-hidden flex flex-col bg-[#061C12] font-sans text-white">
      <AuroraBackground />
      <StatusBar />

      {/* Header */}
      <header className="relative z-10 px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full border-2 border-[#C9963F] p-0.5 relative">
            <img 
              src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=150" 
              alt="Profile" 
              className="w-full h-full rounded-full object-cover"
            />
            <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-[#061C12] rounded-full" />
          </div>
          <div>
            <h2 className="text-lg font-bold">ريان أبوطالب</h2>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-[#C9963F]">مدير النظام</span>
              <span className="text-white/40">•</span>
              <span className="text-white/60">الإدارة الفنية</span>
            </div>
          </div>
        </div>
        <button className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md border border-white/10 flex items-center justify-center relative">
          <Bell className="w-5 h-5 text-white/80" />
          <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-red-500 rounded-full shadow-[0_0_8px_rgba(239,68,68,0.6)]" />
        </button>
      </header>

      {/* Main Content Area */}
      <main className="relative z-10 flex-1 overflow-y-auto px-6 pb-28 custom-scrollbar">
        
        {/* Home Screen */}
        {activeTab === 'home' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between pt-2">
              <h3 className="text-xl font-bold">الأربعاء، ٢٢ يوليو ٢٠٢٦</h3>
              <div className="px-3 py-1 bg-white/10 rounded-full text-xs text-white/70 border border-white/5 backdrop-blur-md">
                ٨:٤٥ صباحاً
              </div>
            </div>

            <GlassCard className="p-6 relative overflow-hidden group">
              <div className="absolute -right-10 -top-10 w-40 h-40 bg-[#00BFA5] opacity-10 rounded-full blur-2xl group-hover:opacity-20 transition-opacity" />
              
              <div className="flex justify-between items-start mb-8 relative z-10">
                <div>
                  <h4 className="text-white/70 mb-1">حالة الحضور</h4>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-red-400" />
                    <span className="text-xl font-semibold">لم يتم التسجيل</span>
                  </div>
                </div>
                <div className="w-12 h-12 rounded-xl bg-black/20 flex items-center justify-center border border-white/10">
                  <MapPin className="w-6 h-6 text-[#00BFA5]" />
                </div>
              </div>

              <button className="relative z-10 w-full bg-gradient-to-r from-[#00BFA5] to-[#00897B] hover:opacity-90 text-white font-bold py-4 rounded-xl shadow-[0_8px_20px_rgba(0,191,165,0.25)] transition-all active:scale-[0.98] flex items-center justify-center gap-2">
                <Fingerprint className="w-5 h-5" />
                تسجيل الحضور
              </button>
              
              <div className="flex justify-between text-sm text-white/50 mt-4 relative z-10">
                <span>الوردية: ٨:٠٠ ص - ٤:٠٠ م</span>
                <span>الموقع: المقر الرئيسي</span>
              </div>
            </GlassCard>

            <div>
              <h4 className="text-lg font-semibold mb-4">ملخص الأسبوع</h4>
              <div className="grid grid-cols-2 gap-4">
                <GlassCard className="p-4 flex flex-col gap-2">
                  <div className="w-8 h-8 rounded-full bg-[#00BFA5]/20 flex items-center justify-center text-[#00BFA5]">
                    <Clock className="w-4 h-4" />
                  </div>
                  <span className="text-2xl font-bold">٣٢<span className="text-sm font-normal text-white/50 ml-1">ساعة</span></span>
                  <span className="text-xs text-white/60">ساعات العمل المنجزة</span>
                </GlassCard>
                <GlassCard className="p-4 flex flex-col gap-2">
                  <div className="w-8 h-8 rounded-full bg-[#C9963F]/20 flex items-center justify-center text-[#C9963F]">
                    <AlertCircle className="w-4 h-4" />
                  </div>
                  <span className="text-2xl font-bold">٢<span className="text-sm font-normal text-white/50 ml-1">تأخير</span></span>
                  <span className="text-xs text-white/60">هذا الشهر</span>
                </GlassCard>
              </div>
            </div>

            <GlassCard className="p-5">
              <div className="flex justify-between items-center mb-4">
                <h4 className="font-semibold">آخر الحركات</h4>
                <button className="text-xs text-[#00BFA5]">عرض الكل</button>
              </div>
              <div className="space-y-4">
                {[
                  { title: 'تسجيل انصراف', time: 'أمس، ٤:١٥ م', status: 'منتظم', color: 'text-green-400' },
                  { title: 'تسجيل حضور', time: 'أمس، ٨:٠٥ ص', status: 'متأخر ٥ د', color: 'text-[#C9963F]' }
                ].map((item, i) => (
                  <div key={i} className="flex justify-between items-center pb-4 border-b border-white/10 last:border-0 last:pb-0">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center">
                        <CheckCircle2 className={`w-5 h-5 ${item.color}`} />
                      </div>
                      <div>
                        <p className="font-medium">{item.title}</p>
                        <p className="text-xs text-white/50">{item.time}</p>
                      </div>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-md bg-white/5 ${item.color}`}>
                      {item.status}
                    </span>
                  </div>
                ))}
              </div>
            </GlassCard>
          </div>
        )}

        {/* Schedule Screen */}
        {activeTab === 'schedule' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h3 className="text-xl font-bold pt-2">جدول العمل</h3>
            
            <GlassCard className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h4 className="font-semibold text-[#00BFA5]">الأسبوع الحالي</h4>
                <div className="flex gap-2">
                  <button className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20">
                    <ChevronLeft className="w-4 h-4 rotate-180" />
                  </button>
                  <button className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20">
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-6">
                <div className="flex justify-between items-end border-b border-white/10 pb-4">
                  <div>
                    <p className="text-sm text-white/60 mb-1">الوردية الصباحية</p>
                    <p className="text-2xl font-bold">٨:٠٠ ص - ٤:٠٠ م</p>
                  </div>
                  <div className="px-3 py-1 rounded-full bg-[#00BFA5]/20 text-[#00BFA5] text-xs font-medium border border-[#00BFA5]/30">
                    ٤٠ ساعة / أسبوع
                  </div>
                </div>

                <div className="flex justify-between">
                  {['أحد', 'إثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة', 'سبت'].map((day, i) => {
                    const isWorkDay = i < 5;
                    const isToday = i === 3;
                    return (
                      <div key={day} className="flex flex-col items-center gap-2">
                        <span className={`text-xs ${isToday ? 'text-[#00BFA5] font-bold' : 'text-white/60'}`}>{day}</span>
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium
                          ${isToday ? 'bg-[#00BFA5] text-white shadow-[0_0_15px_rgba(0,191,165,0.4)]' : 
                            isWorkDay ? 'bg-white/10' : 'bg-transparent text-white/30 border border-white/5'}`}
                        >
                          {19 + i}
                        </div>
                        {isWorkDay && <div className={`w-1 h-1 rounded-full ${isToday ? 'bg-[#00BFA5]' : 'bg-white/30'}`} />}
                      </div>
                    );
                  })}
                </div>
              </div>
            </GlassCard>

            <h4 className="text-lg font-semibold mb-2 mt-8">المهام المجدولة</h4>
            <div className="space-y-4">
              {[
                { time: '١٠:٠٠ ص', title: 'اجتماع الإدارة الأسبوعي', duration: '١ ساعة' },
                { time: '١:٣٠ م', title: 'مراجعة تقارير الأداء', duration: '٣٠ دقيقة' },
              ].map((task, i) => (
                <GlassCard key={i} className="p-4 flex gap-4 items-center">
                  <div className="flex flex-col items-center justify-center px-3 py-2 bg-black/20 rounded-xl min-w-[70px]">
                    <span className="text-sm font-bold">{task.time.split(' ')[0]}</span>
                    <span className="text-xs text-white/60">{task.time.split(' ')[1]}</span>
                  </div>
                  <div className="flex-1">
                    <p className="font-medium mb-1">{task.title}</p>
                    <p className="text-xs text-white/50">{task.duration}</p>
                  </div>
                </GlassCard>
              ))}
            </div>
          </div>
        )}

        {/* Vacations Screen */}
        {activeTab === 'vacations' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between pt-2">
              <h3 className="text-xl font-bold">الرصيد والإجازات</h3>
              <button className="flex items-center gap-1 text-sm text-[#00BFA5]">
                سجل الإجازات
                <ChevronLeft className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <GlassCard className="p-5 flex flex-col items-center justify-center text-center relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-[#00BFA5]/20 to-transparent opacity-50" />
                <div className="relative z-10">
                  <span className="text-3xl font-bold text-[#00BFA5]">٢٤</span>
                  <p className="text-sm text-white/70 mt-1">يوم متبقي</p>
                  <p className="text-xs text-white/40 mt-1">إجازة سنوية</p>
                </div>
              </GlassCard>
              <GlassCard className="p-5 flex flex-col items-center justify-center text-center">
                <span className="text-3xl font-bold">٣</span>
                <p className="text-sm text-white/70 mt-1">أيام متبقية</p>
                <p className="text-xs text-white/40 mt-1">إجازة عرضية</p>
              </GlassCard>
            </div>

            <h4 className="text-lg font-semibold mt-6 mb-4">الطلبات الحالية</h4>
            <div className="space-y-4">
              <GlassCard className="p-5">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#C9963F]/20 flex items-center justify-center text-[#C9963F]">
                      <Palmtree className="w-5 h-5" />
                    </div>
                    <div>
                      <h5 className="font-semibold">إجازة سنوية</h5>
                      <p className="text-xs text-white/50">١٢ أغسطس - ٢٥ أغسطس (١٤ يوم)</p>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-md bg-[#C9963F]/20 text-[#C9963F] text-xs font-medium border border-[#C9963F]/30">
                    مرفوعة
                  </span>
                </div>
                <div className="w-full bg-white/5 h-1.5 rounded-full mt-4 overflow-hidden">
                  <div className="bg-[#C9963F] w-1/2 h-full rounded-full" />
                </div>
                <p className="text-xs text-white/40 mt-2 text-left">في انتظار موافقة المدير المباشر</p>
              </GlassCard>

              <GlassCard className="p-5">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#00BFA5]/20 flex items-center justify-center text-[#00BFA5]">
                      <Clock className="w-5 h-5" />
                    </div>
                    <div>
                      <h5 className="font-semibold">استئذان شخصي</h5>
                      <p className="text-xs text-white/50">اليوم، ٢:٠٠ م - ٤:٠٠ م (ساعتان)</p>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-md bg-[#00BFA5]/20 text-[#00BFA5] text-xs font-medium border border-[#00BFA5]/30">
                    مقبولة
                  </span>
                </div>
              </GlassCard>
            </div>

            {/* Floating Action Button */}
            <div className="absolute bottom-28 left-6">
              <button className="w-14 h-14 rounded-full bg-gradient-to-r from-[#00BFA5] to-[#00897B] text-white flex items-center justify-center shadow-[0_8px_20px_rgba(0,191,165,0.4)] hover:scale-105 transition-transform">
                <Plus className="w-6 h-6" />
              </button>
            </div>
          </div>
        )}

        {/* Messages Screen */}
        {activeTab === 'messages' && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500 h-full flex flex-col">
            <h3 className="text-xl font-bold pt-2 mb-2">الرسائل</h3>
            
            <div className="relative mb-4">
              <input 
                type="text" 
                placeholder="ابحث في الرسائل..." 
                className="w-full bg-white/10 border border-white/10 rounded-xl py-2.5 px-4 text-sm text-white placeholder-white/40 focus:outline-none focus:border-[#00BFA5]/50"
              />
            </div>

            <div className="flex-1 space-y-3">
              {[
                { name: 'أحمد محمود', role: 'الموارد البشرية', msg: 'تم اعتماد طلب الإجازة الخاص بك.', time: '١٠:٤٢ ص', unread: true },
                { name: 'سارة خالد', role: 'مدير المشروع', msg: 'هل يمكنك إرسال التقرير الأسبوعي؟', time: 'أمس', unread: false },
                { name: 'فريق الدعم الفني', role: 'النظام', msg: 'سيتم تحديث النظام غداً في تمام الساعة...', time: '٢٠ يوليو', unread: false },
              ].map((chat, i) => (
                <GlassCard key={i} className="p-4 hover:bg-white-[0.15] transition-colors cursor-pointer">
                  <div className="flex gap-4">
                    <div className="relative">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-white/20 to-white/5 p-[1px]">
                        <div className="w-full h-full rounded-full bg-black/40 flex items-center justify-center">
                          <span className="font-bold text-white/80">{chat.name.split(' ').map(n=>n[0]).join('')}</span>
                        </div>
                      </div>
                      {chat.unread && <div className="absolute top-0 right-0 w-3.5 h-3.5 bg-[#00BFA5] border-2 border-[#061C12] rounded-full" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-baseline mb-1">
                        <h5 className={`font-semibold truncate ${chat.unread ? 'text-white' : 'text-white/80'}`}>{chat.name}</h5>
                        <span className="text-xs text-white/50 shrink-0 mr-2">{chat.time}</span>
                      </div>
                      <p className={`text-sm truncate ${chat.unread ? 'text-white/90 font-medium' : 'text-white/50'}`}>
                        {chat.msg}
                      </p>
                    </div>
                  </div>
                </GlassCard>
              ))}
            </div>
          </div>
        )}

        {/* Profile Screen */}
        {activeTab === 'profile' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-8">
            <div className="flex flex-col items-center pt-6 pb-4">
              <div className="w-24 h-24 rounded-full border-4 border-[#C9963F]/30 p-1 mb-4 relative group cursor-pointer">
                <img 
                  src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=150" 
                  alt="Profile" 
                  className="w-full h-full rounded-full object-cover"
                />
                <div className="absolute inset-1 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Settings className="w-6 h-6 text-white" />
                </div>
              </div>
              <h3 className="text-2xl font-bold mb-1">ريان أبوطالب</h3>
              <div className="flex items-center gap-2 px-3 py-1 bg-[#C9963F]/10 border border-[#C9963F]/20 rounded-full">
                <span className="text-[#C9963F] text-sm font-medium">مدير النظام</span>
              </div>
            </div>

            <GlassCard className="overflow-hidden">
              <div className="p-4 border-b border-white/10 flex justify-between items-center">
                <div className="flex items-center gap-3 text-white/70">
                  <User className="w-5 h-5" />
                  <span>الرقم الوظيفي</span>
                </div>
                <span className="font-medium">EMP-2023-084</span>
              </div>
              <div className="p-4 border-b border-white/10 flex justify-between items-center">
                <div className="flex items-center gap-3 text-white/70">
                  <MapPin className="w-5 h-5" />
                  <span>القسم</span>
                </div>
                <span className="font-medium">الإدارة الفنية</span>
              </div>
              <div className="p-4 flex justify-between items-center">
                <div className="flex items-center gap-3 text-white/70">
                  <Clock className="w-5 h-5" />
                  <span>تاريخ الالتحاق</span>
                </div>
                <span className="font-medium">١٥ مارس ٢٠٢١</span>
              </div>
            </GlassCard>

            <h4 className="text-lg font-semibold px-1 mt-6 mb-2">الإعدادات</h4>
            <GlassCard className="overflow-hidden">
              {[
                { icon: <Settings className="w-5 h-5" />, label: 'تفضيلات التطبيق' },
                { icon: <Shield className="w-5 h-5" />, label: 'الخصوصية والأمان' },
                { icon: <Bell className="w-5 h-5" />, label: 'الإشعارات' }
              ].map((item, i) => (
                <button key={i} className="w-full p-4 flex items-center justify-between border-b border-white/10 last:border-0 hover:bg-white/5 transition-colors">
                  <div className="flex items-center gap-3 text-white/80">
                    {item.icon}
                    <span>{item.label}</span>
                  </div>
                  <ChevronLeft className="w-4 h-4 text-white/40" />
                </button>
              ))}
            </GlassCard>

            <button 
              onClick={() => setIsLoggedIn(false)}
              className="w-full py-4 mt-6 rounded-xl border border-red-500/30 text-red-400 font-medium flex items-center justify-center gap-2 hover:bg-red-500/10 transition-colors"
            >
              <LogOut className="w-5 h-5" />
              تسجيل الخروج
            </button>
          </div>
        )}
      </main>

      {/* Bottom Tab Bar */}
      <nav className="absolute bottom-0 w-full h-[88px] bg-[#061C12]/90 backdrop-blur-xl border-t border-white/10 z-50 px-6 pb-6 pt-3 flex justify-between items-center">
        {[
          { id: 'profile', icon: <User className="w-6 h-6" />, label: 'ملفي' },
          { id: 'messages', icon: <MessageCircle className="w-6 h-6" />, label: 'رسائل' },
          { id: 'vacations', icon: <Palmtree className="w-6 h-6" />, label: 'إجازات' },
          { id: 'schedule', icon: <Calendar className="w-6 h-6" />, label: 'جدول' },
          { id: 'home', icon: <Home className="w-6 h-6" />, label: 'الرئيسية' },
        ].map(tab => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-col items-center gap-1 transition-all duration-300 ${isActive ? 'text-[#00BFA5] -translate-y-1' : 'text-white/40 hover:text-white/60'}`}
            >
              <div className="relative">
                {tab.icon}
                {isActive && (
                  <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-[#00BFA5] rounded-full shadow-[0_0_8px_rgba(0,191,165,0.8)]" />
                )}
              </div>
              <span className="text-[10px] font-medium">{tab.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}

export default AuroraGradient;