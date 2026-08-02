export function EmeraldV2() {
  const GREEN_DARK  = "#0A4D2E";
  const GREEN_MID   = "#0D6B3F";
  const GREEN_LIGHT = "#128A50";
  const GOLD        = "#C9963F";
  const GOLD_LIGHT  = "#E8B86D";
  const CREAM       = "#F9FAF7";
  const WHITE       = "#FFFFFF";
  const TEXT        = "#1A1F1C";
  const MUTED       = "#6B7A72";
  const BORDER      = "#E4EBE7";

  return (
    <div style={{
      width: 390, height: 820,
      background: CREAM,
      fontFamily: "'Segoe UI', 'SF Pro Display', system-ui, sans-serif",
      direction: "rtl",
      overflow: "hidden",
      position: "relative",
      display: "flex",
      flexDirection: "column",
    }}>

      {/* ── Status bar ─────────────────────────────────── */}
      <div style={{
        background: GREEN_DARK,
        padding: "11px 20px 9px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexShrink: 0,
      }}>
        <span style={{ color: "rgba(255,255,255,0.9)", fontSize: 13, fontWeight: 600, letterSpacing: 0.2 }}>9:41</span>
        <div style={{ display: "flex", gap: 7, alignItems: "center" }}>
          {/* Signal bars */}
          <svg width="16" height="11" viewBox="0 0 16 11" fill="none">
            <rect x="0"   y="5" width="3" height="6" rx="1" fill="white" />
            <rect x="4.5" y="3" width="3" height="8" rx="1" fill="white" />
            <rect x="9"   y="1" width="3" height="10" rx="1" fill="white" />
            <rect x="13.5" y="0" width="2.5" height="11" rx="1" fill="rgba(255,255,255,0.35)" />
          </svg>
          {/* WiFi */}
          <svg width="15" height="11" viewBox="0 0 15 11" fill="white">
            <path d="M7.5 8.5a1.5 1.5 0 110 3 1.5 1.5 0 010-3z"/>
            <path d="M7.5 5C5.6 5 3.9 5.8 2.7 7l1.3 1.3C5 7.5 6.2 7 7.5 7s2.5.5 3.5 1.3L12.3 7C11.1 5.8 9.4 5 7.5 5z" opacity=".85"/>
            <path d="M7.5 1C4.4 1 1.6 2.3 0 4.4l1.4 1.3C2.9 3.8 5.1 2.5 7.5 2.5S12.1 3.8 13.6 5.7L15 4.4C13.4 2.3 10.6 1 7.5 1z" opacity=".5"/>
          </svg>
          {/* Battery */}
          <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
            <div style={{
              width: 22, height: 11, borderRadius: 3,
              border: "1.5px solid rgba(255,255,255,0.55)",
              padding: 1.5,
              display: "flex",
              alignItems: "center",
            }}>
              <div style={{ background: "#4ADE80", borderRadius: 1.5, width: "75%", height: "100%" }} />
            </div>
            <div style={{ width: 2, height: 5, background: "rgba(255,255,255,0.45)", borderRadius: "0 1px 1px 0" }} />
          </div>
        </div>
      </div>

      {/* ── Header ─────────────────────────────────────── */}
      <div style={{
        background: `linear-gradient(165deg, ${GREEN_DARK} 0%, ${GREEN_MID} 55%, ${GREEN_LIGHT} 100%)`,
        padding: "18px 20px 28px",
        position: "relative",
        overflow: "hidden",
        flexShrink: 0,
      }}>
        {/* Decorative circles */}
        <div style={{ position:"absolute", top:-50, left:-50, width:160, height:160, borderRadius:"50%", background:"rgba(255,255,255,0.04)" }} />
        <div style={{ position:"absolute", bottom:-40, left:80, width:100, height:100, borderRadius:"50%", background:`rgba(201,150,63,0.08)` }} />
        <div style={{ position:"absolute", top:10, left:20, width:60, height:60, borderRadius:"50%", background:"rgba(255,255,255,0.03)" }} />

        {/* Top row */}
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", position:"relative" }}>
          {/* User info */}
          <div style={{ display:"flex", alignItems:"center", gap:13 }}>
            <div style={{
              width: 52, height: 52, borderRadius: 26,
              background: `linear-gradient(135deg, ${GOLD} 0%, ${GOLD_LIGHT} 100%)`,
              display:"flex", alignItems:"center", justifyContent:"center",
              fontSize: 22, fontWeight: 800, color: GREEN_DARK,
              boxShadow: `0 4px 14px rgba(201,150,63,0.4)`,
              flexShrink: 0,
            }}>ر</div>
            <div>
              <div style={{ color:"rgba(255,255,255,0.65)", fontSize:12, marginBottom:4, letterSpacing:0.3 }}>
                أهلاً بك 👋
              </div>
              <div style={{ color:WHITE, fontSize:18, fontWeight:700, letterSpacing:-0.3 }}>
                ريان أبوطالب
              </div>
              <div style={{ color:`rgba(201,150,63,0.9)`, fontSize:11, marginTop:3, fontWeight:500 }}>
                مدير النظام
              </div>
            </div>
          </div>

        </div>

        {/* Hijri + Milady date strip */}
        <div style={{
          marginTop: 16,
          background:"rgba(255,255,255,0.08)",
          borderRadius:10,
          padding:"8px 14px",
          display:"flex",
          alignItems:"center",
          justifyContent:"space-between",
          position:"relative",
        }}>
          {/* Hijri */}
          <div style={{ display:"flex", alignItems:"center", gap:7 }}>
            <span style={{ fontSize:14 }}>🕌</span>
            <div>
              <div style={{ color:"rgba(255,255,255,0.5)", fontSize:9, letterSpacing:0.3 }}>هجري</div>
              <div style={{ color:"rgba(255,255,255,0.85)", fontSize:12, fontWeight:600 }}>
                ٢٥ محرم ١٤٤٨ هـ
              </div>
            </div>
          </div>

          {/* Divider */}
          <div style={{ width:1, height:28, background:"rgba(255,255,255,0.15)" }} />

          {/* Milady */}
          <div style={{ display:"flex", alignItems:"center", gap:7 }}>
            <span style={{ fontSize:14 }}>📅</span>
            <div>
              <div style={{ color:"rgba(255,255,255,0.5)", fontSize:9, letterSpacing:0.3 }}>ميلادي</div>
              <div style={{ color:"rgba(255,255,255,0.85)", fontSize:12, fontWeight:600 }}>
                ٢١ يوليو ٢٠٢٦
              </div>
            </div>
          </div>

          {/* Work day badge */}
          <div style={{ display:"flex", alignItems:"center", gap:5 }}>
            <div style={{ width:7, height:7, borderRadius:"50%", background:"#4ADE80", boxShadow:"0 0 0 2px rgba(74,222,128,0.3)" }} />
            <span style={{ color:"#4ADE80", fontSize:11, fontWeight:600 }}>يوم عمل</span>
          </div>
        </div>
      </div>

      {/* ── Floating status card ────────────────────────── */}
      <div style={{ padding:"0 16px", marginTop:-18, position:"relative", zIndex:2, flexShrink:0 }}>
        <div style={{
          background: WHITE,
          borderRadius: 22,
          padding: "18px 20px",
          boxShadow: "0 12px 40px rgba(10,77,46,0.14), 0 2px 8px rgba(0,0,0,0.06)",
          border: `1px solid ${BORDER}`,
        }}>
          {/* Card header */}
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
            <span style={{ fontSize:13, color:MUTED, fontWeight:600, letterSpacing:0.2 }}>حالة اليوم</span>
            <div style={{
              display:"flex", alignItems:"center", gap:7,
              background:"#ECFDF5",
              border:"1.5px solid #6EE7B7",
              borderRadius:20,
              padding:"5px 14px",
            }}>
              <div style={{ width:8, height:8, borderRadius:"50%", background:"#10B981", boxShadow:"0 0 0 3px rgba(16,185,129,0.2)" }} />
              <span style={{ color:"#065F46", fontSize:13, fontWeight:700 }}>حاضر</span>
            </div>
          </div>

          {/* Stats row */}
          <div style={{ display:"flex", alignItems:"stretch" }}>
            {[
              { label:"وقت الدخول", value:"07:58", sub:"صباحاً", accent:true },
              { label:"مدة العمل",  value:"04:23", sub:"ساعة", accent:false },
              { label:"الوردية",    value:"08–16", sub:"اليوم",  accent:false },
            ].map((stat, i) => (
              <div key={stat.label} style={{
                flex:1,
                textAlign:"center",
                borderRight: i < 2 ? `1px solid ${BORDER}` : "none",
                paddingLeft: i > 0 ? 8 : 0,
                paddingRight: i < 2 ? 8 : 0,
              }}>
                <div style={{ fontSize:10, color:MUTED, marginBottom:5, letterSpacing:0.3 }}>{stat.label}</div>
                <div style={{
                  fontSize: i===0 ? 22 : 17,
                  fontWeight: 800,
                  color: stat.accent ? GREEN_MID : TEXT,
                  letterSpacing: -0.5,
                  lineHeight: 1.1,
                }}>{stat.value}</div>
                <div style={{ fontSize:10, color:MUTED, marginTop:3 }}>{stat.sub}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Check-in confirmed banner ───────────────────── */}
      <div style={{ padding:"12px 16px 0", flexShrink:0 }}>
        <div style={{
          background: `linear-gradient(130deg, ${GREEN_DARK} 0%, ${GREEN_MID} 100%)`,
          borderRadius: 18,
          padding: "16px 20px",
          display:"flex",
          alignItems:"center",
          gap:14,
          boxShadow: `0 8px 28px rgba(10,77,46,0.28)`,
          position:"relative",
          overflow:"hidden",
        }}>
          {/* Glow */}
          <div style={{
            position:"absolute", top:-20, left:40,
            width:80, height:80, borderRadius:"50%",
            background:`rgba(201,150,63,0.15)`, filter:"blur(20px)",
          }}/>

          {/* Icon */}
          <div style={{
            width:48, height:48, borderRadius:24, flexShrink:0,
            background:"rgba(255,255,255,0.15)",
            display:"flex", alignItems:"center", justifyContent:"center",
            border:"1.5px solid rgba(255,255,255,0.2)",
          }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path d="M9 12l2 2 4-4" stroke="#4ADE80" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              <circle cx="12" cy="12" r="9" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5"/>
            </svg>
          </div>

          <div style={{ flex:1, position:"relative" }}>
            <div style={{ color:WHITE, fontSize:16, fontWeight:700, marginBottom:3 }}>تم تسجيل الحضور</div>
            <div style={{ color:"rgba(255,255,255,0.65)", fontSize:12 }}>الموقع مُسجَّل · ٢١ يوليو ٢٠٢٦ · ٧:٥٨ ص</div>
          </div>

          {/* Gold badge */}
          <div style={{
            background:`linear-gradient(135deg, ${GOLD} 0%, ${GOLD_LIGHT} 100%)`,
            borderRadius:10,
            padding:"5px 10px",
            flexShrink:0,
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M20 6L9 17l-5-5" stroke={GREEN_DARK} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        </div>
      </div>

      {/* ── Quick access tiles ──────────────────────────── */}
      <div style={{ padding:"12px 16px 0", flexShrink:0 }}>
        <div style={{ display:"flex", gap:10 }}>
          {[
            { icon:"📊", label:"سجل الحضور", bg:"#F0FDF7", border:"#A7F3D0", color:GREEN_MID },
            { icon:"✈️", label:"إجازاتي",    bg:"#FFFBEB", border:"#FDE68A", color:"#92400E" },
            { icon:"📢", label:"الإعلانات",  bg:"#EFF6FF", border:"#BFDBFE", color:"#1E40AF" },
          ].map(item => (
            <div key={item.label} style={{
              flex:1,
              background:item.bg,
              borderRadius:16,
              border:`1.5px solid ${item.border}`,
              padding:"14px 8px 12px",
              textAlign:"center",
              cursor:"pointer",
            }}>
              <div style={{ fontSize:26, marginBottom:7 }}>{item.icon}</div>
              <div style={{ fontSize:11, color:item.color, fontWeight:600 }}>{item.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Announcement card ───────────────────────────── */}
      <div style={{ padding:"12px 16px 0", flexShrink:0 }}>
        <div style={{
          background:WHITE,
          borderRadius:14,
          padding:"14px 16px",
          border:`1px solid ${BORDER}`,
          borderRight:`4px solid ${GOLD}`,
          display:"flex",
          alignItems:"flex-start",
          gap:12,
        }}>
          <div style={{
            width:36, height:36, borderRadius:18, flexShrink:0,
            background:`rgba(201,150,63,0.12)`,
            display:"flex", alignItems:"center", justifyContent:"center",
            fontSize:18,
          }}>📢</div>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:11, color:GOLD, fontWeight:700, marginBottom:4, letterSpacing:0.3 }}>إعلان جديد</div>
            <div style={{ fontSize:13, color:TEXT, fontWeight:500, lineHeight:1.5 }}>
              اجتماع الفريق يوم الأحد الساعة ١٠ صباحاً في قاعة الاجتماعات
            </div>
          </div>
          <div style={{ fontSize:20, color:MUTED, flexShrink:0 }}>‹</div>
        </div>
      </div>

      {/* ── Bottom nav ──────────────────────────────────── */}
      <div style={{
        marginTop:"auto",
        background:WHITE,
        borderTop:`1px solid ${BORDER}`,
        padding:"10px 10px 22px",
        display:"flex",
        justifyContent:"space-around",
        boxShadow:"0 -4px 20px rgba(0,0,0,0.05)",
      }}>
        {[
          {
            label:"الرئيسية", active:true,
            icon:(c:string) => (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            )
          },
          {
            label:"الجدول", active:false,
            icon:(c:string) => (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <rect x="3" y="4" width="18" height="18" rx="2" stroke={c} strokeWidth="2"/>
                <path d="M16 2v4M8 2v4M3 10h18" stroke={c} strokeWidth="2" strokeLinecap="round"/>
              </svg>
            )
          },
          {
            label:"إجازة", active:false,
            icon:(c:string) => (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="4" stroke={c} strokeWidth="2"/>
                <path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" stroke={c} strokeWidth="2" strokeLinecap="round"/>
              </svg>
            )
          },
          {
            label:"إعلانات", active:false,
            icon:(c:string) => (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            )
          },
          {
            label:"الملف", active:false,
            icon:(c:string) => (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" stroke={c} strokeWidth="2" strokeLinecap="round"/>
                <circle cx="12" cy="7" r="4" stroke={c} strokeWidth="2"/>
              </svg>
            )
          },
        ].map(item => {
          const activeColor = GREEN_MID;
          const inactiveColor = "#9CA3AF";
          const color = item.active ? activeColor : inactiveColor;
          return (
            <div key={item.label} style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:4, minWidth:48 }}>
              {item.icon(color)}
              <span style={{ fontSize:10, color, fontWeight: item.active ? 700 : 400 }}>{item.label}</span>
              {item.active && (
                <div style={{ width:20, height:3, borderRadius:2, background:`linear-gradient(90deg, ${GREEN_MID}, ${GOLD})`, marginTop:-2 }} />
              )}
            </div>
          );
        })}
      </div>

    </div>
  );
}
