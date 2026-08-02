export function ClassicGovt() {
  return (
    <div
      className="flex flex-col"
      style={{
        width: 390,
        height: 820,
        background: "#F2F4F8",
        fontFamily: "'Segoe UI', system-ui, sans-serif",
        direction: "rtl",
        overflow: "hidden",
        position: "relative",
      }}
    >
      {/* Status bar */}
      <div
        style={{
          background: "#1B3D6E",
          padding: "10px 20px 8px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <span style={{ color: "white", fontSize: 13, fontWeight: 600 }}>9:41</span>
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          <svg width="16" height="12" viewBox="0 0 16 12" fill="white">
            <rect x="0" y="3" width="3" height="9" rx="1" />
            <rect x="4.5" y="2" width="3" height="10" rx="1" />
            <rect x="9" y="0" width="3" height="12" rx="1" />
            <rect x="13.5" y="1" width="2.5" height="11" rx="1" opacity="0.4" />
          </svg>
          <svg width="16" height="12" viewBox="0 0 16 12" fill="white">
            <path d="M8 2C5 2 2.5 3.5 1 5.5L2.5 7C3.6 5.4 5.7 4 8 4s4.4 1.4 5.5 3L15 5.5C13.5 3.5 11 2 8 2z" />
            <path d="M8 5c-1.8 0-3.3.9-4.2 2.2L5.3 9c.6-1 1.6-1.7 2.7-1.7s2.1.7 2.7 1.7l1.5-1.8C11.3 5.9 9.8 5 8 5z" />
            <circle cx="8" cy="11" r="1.5" />
          </svg>
          <div style={{
            background: "white",
            borderRadius: 3,
            width: 24,
            height: 12,
            display: "flex",
            alignItems: "center",
            padding: "0 2px",
          }}>
            <div style={{ background: "#22C55E", borderRadius: 2, width: 18, height: 8 }} />
          </div>
        </div>
      </div>

      {/* Header */}
      <div style={{
        background: "#1B3D6E",
        padding: "16px 20px 24px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{
            width: 46,
            height: 46,
            borderRadius: 23,
            background: "#C9A84C",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 20,
            fontWeight: 700,
            color: "#1B3D6E",
          }}>ر</div>
          <div>
            <div style={{ color: "rgba(255,255,255,0.7)", fontSize: 12 }}>صباح الخير</div>
            <div style={{ color: "white", fontSize: 16, fontWeight: 700, marginTop: 2 }}>ريان أبوطالب</div>
          </div>
        </div>
        <div style={{
          background: "rgba(255,255,255,0.15)",
          borderRadius: 12,
          padding: "6px 10px",
          color: "white",
          fontSize: 12,
        }}>الثلاثاء ٢١ يوليو</div>
      </div>

      {/* Curved connector */}
      <div style={{
        height: 20,
        background: "#1B3D6E",
        borderRadius: "0 0 24px 24px",
        marginBottom: -2,
      }} />

      {/* Main content */}
      <div style={{ flex: 1, padding: "16px 16px 0", overflowY: "auto" }}>

        {/* Status card */}
        <div style={{
          background: "white",
          borderRadius: 20,
          padding: 20,
          marginBottom: 14,
          boxShadow: "0 4px 20px rgba(27,61,110,0.10)",
          border: "1px solid rgba(27,61,110,0.07)",
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <span style={{ fontSize: 13, color: "#6B7280", fontWeight: 500 }}>حالة اليوم</span>
            <div style={{
              background: "#DCFCE7",
              color: "#15803D",
              borderRadius: 20,
              padding: "5px 14px",
              fontSize: 13,
              fontWeight: 700,
            }}>حاضر ✓</div>
          </div>

          <div style={{ display: "flex", gap: 0 }}>
            <div style={{ flex: 1, textAlign: "center" }}>
              <div style={{ fontSize: 11, color: "#9CA3AF", marginBottom: 4 }}>وقت الحضور</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: "#1B3D6E" }}>07:58</div>
            </div>
            <div style={{ width: 1, background: "#E5E7EB", margin: "0 8px" }} />
            <div style={{ flex: 1, textAlign: "center" }}>
              <div style={{ fontSize: 11, color: "#9CA3AF", marginBottom: 4 }}>مدة العمل</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: "#1B3D6E" }}>04:23:11</div>
            </div>
            <div style={{ width: 1, background: "#E5E7EB", margin: "0 8px" }} />
            <div style={{ flex: 1, textAlign: "center" }}>
              <div style={{ fontSize: 11, color: "#9CA3AF", marginBottom: 4 }}>الوردية</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: "#374151" }}>08:00–16:00</div>
            </div>
          </div>
        </div>

        {/* Check in button — already checked in state */}
        <div style={{
          background: "linear-gradient(135deg, #1B3D6E 0%, #2A5298 100%)",
          borderRadius: 18,
          padding: "22px 20px",
          textAlign: "center",
          marginBottom: 14,
          boxShadow: "0 8px 24px rgba(27,61,110,0.25)",
        }}>
          <div style={{ fontSize: 32, marginBottom: 6 }}>✓</div>
          <div style={{ color: "white", fontSize: 18, fontWeight: 700 }}>تم تسجيل الحضور</div>
          <div style={{ color: "rgba(255,255,255,0.65)", fontSize: 13, marginTop: 4 }}>الموقع مُسجَّل بنجاح</div>
        </div>

        {/* Quick links row */}
        <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
          {[
            { icon: "📋", label: "سجل الحضور" },
            { icon: "📅", label: "إجازاتي" },
            { icon: "🔔", label: "الإشعارات" },
          ].map((item) => (
            <div key={item.label} style={{
              flex: 1,
              background: "white",
              borderRadius: 14,
              padding: "14px 8px",
              textAlign: "center",
              boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
            }}>
              <div style={{ fontSize: 22, marginBottom: 6 }}>{item.icon}</div>
              <div style={{ fontSize: 11, color: "#374151", fontWeight: 500 }}>{item.label}</div>
            </div>
          ))}
        </div>

        {/* Announcement preview */}
        <div style={{
          background: "white",
          borderRadius: 14,
          padding: 16,
          boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
          display: "flex",
          gap: 12,
          alignItems: "flex-start",
          borderRight: "4px solid #C9A84C",
        }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 12, color: "#C9A84C", fontWeight: 700, marginBottom: 4 }}>📢 إعلان</div>
            <div style={{ fontSize: 13, color: "#374151", fontWeight: 500 }}>اجتماع الفريق يوم الأحد الساعة 10 صباحاً</div>
          </div>
        </div>
      </div>

      {/* Bottom Nav */}
      <div style={{
        background: "white",
        borderTop: "1px solid #E5E7EB",
        padding: "10px 0 20px",
        display: "flex",
        justifyContent: "space-around",
        marginTop: 12,
      }}>
        {[
          { icon: "🏠", label: "الرئيسية", active: true },
          { icon: "📅", label: "الجدول" },
          { icon: "☀️", label: "إجازة" },
          { icon: "📢", label: "إعلانات" },
          { icon: "👤", label: "الملف" },
        ].map((item) => (
          <div key={item.label} style={{ textAlign: "center" }}>
            <div style={{ fontSize: 22 }}>{item.icon}</div>
            <div style={{
              fontSize: 10,
              marginTop: 2,
              color: item.active ? "#1B3D6E" : "#9CA3AF",
              fontWeight: item.active ? 700 : 400,
            }}>{item.label}</div>
            {item.active && (
              <div style={{ width: 4, height: 4, borderRadius: 2, background: "#1B3D6E", margin: "2px auto 0" }} />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
