export function EmeraldAuthority() {
  return (
    <div
      style={{
        width: 390,
        height: 820,
        background: "#F7FAF8",
        fontFamily: "'Segoe UI', system-ui, sans-serif",
        direction: "rtl",
        overflow: "hidden",
        position: "relative",
      }}
    >
      {/* Status bar */}
      <div style={{
        background: "#0B5E35",
        padding: "10px 20px 8px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}>
        <span style={{ color: "white", fontSize: 13, fontWeight: 600 }}>9:41</span>
        <div style={{ display: "flex", gap: 5, alignItems: "center" }}>
          <svg width="15" height="11" viewBox="0 0 16 12" fill="white">
            <rect x="0" y="3" width="3" height="9" rx="1" />
            <rect x="4.5" y="2" width="3" height="10" rx="1" />
            <rect x="9" y="0" width="3" height="12" rx="1" />
            <rect x="13.5" y="1" width="2.5" height="11" rx="1" opacity="0.4" />
          </svg>
          <div style={{
            background: "rgba(255,255,255,0.3)",
            borderRadius: 3,
            width: 24,
            height: 12,
            display: "flex",
            alignItems: "center",
            padding: "0 2px",
          }}>
            <div style={{ background: "#FFD700", borderRadius: 2, width: 18, height: 8 }} />
          </div>
        </div>
      </div>

      {/* Header banner */}
      <div style={{
        background: "linear-gradient(160deg, #0B5E35 0%, #147244 60%, #1A8A52 100%)",
        padding: "18px 20px 36px",
        position: "relative",
        overflow: "hidden",
      }}>
        {/* Decorative circle */}
        <div style={{
          position: "absolute",
          top: -20,
          left: -20,
          width: 120,
          height: 120,
          borderRadius: "50%",
          background: "rgba(255,255,255,0.06)",
        }} />
        <div style={{
          position: "absolute",
          bottom: -30,
          left: 60,
          width: 80,
          height: 80,
          borderRadius: "50%",
          background: "rgba(255,215,0,0.08)",
        }} />

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", position: "relative" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{
              width: 50,
              height: 50,
              borderRadius: 25,
              background: "rgba(255,255,255,0.2)",
              border: "2px solid rgba(255,215,0,0.5)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 22,
              fontWeight: 700,
              color: "white",
            }}>ر</div>
            <div>
              <div style={{ color: "rgba(255,255,255,0.7)", fontSize: 12 }}>أهلاً بك</div>
              <div style={{ color: "white", fontSize: 17, fontWeight: 700, marginTop: 2 }}>ريان أبوطالب</div>
            </div>
          </div>
          <div style={{
            background: "rgba(255,255,255,0.15)",
            borderRadius: 10,
            padding: "6px 12px",
          }}>
            <div style={{ color: "white", fontSize: 11, textAlign: "center" }}>الثلاثاء</div>
            <div style={{ color: "#FFD700", fontSize: 16, fontWeight: 700, textAlign: "center" }}>21</div>
            <div style={{ color: "white", fontSize: 10, textAlign: "center" }}>يوليو</div>
          </div>
        </div>
      </div>

      {/* Floating status card */}
      <div style={{ padding: "0 16px", marginTop: -20, position: "relative", zIndex: 1 }}>
        <div style={{
          background: "white",
          borderRadius: 22,
          padding: 20,
          boxShadow: "0 8px 32px rgba(11,94,53,0.15)",
          marginBottom: 14,
          border: "1px solid rgba(11,94,53,0.08)",
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <span style={{ fontSize: 14, color: "#374151", fontWeight: 600 }}>حالة الحضور</span>
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              background: "#F0FDF4",
              border: "1px solid #BBF7D0",
              borderRadius: 20,
              padding: "5px 14px",
            }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#22C55E" }} />
              <span style={{ color: "#15803D", fontSize: 13, fontWeight: 700 }}>حاضر</span>
            </div>
          </div>

          <div style={{ display: "flex", gap: 0 }}>
            {[
              { label: "وقت الدخول", value: "07:58", color: "#0B5E35" },
              { label: "مدة العمل", value: "04:23:11", color: "#0B5E35" },
              { label: "الوردية", value: "08–16", color: "#374151" },
            ].map((stat, i) => (
              <div key={stat.label} style={{
                flex: 1,
                textAlign: "center",
                borderRight: i < 2 ? "1px solid #F3F4F6" : "none",
                paddingRight: i < 2 ? 8 : 0,
              }}>
                <div style={{ fontSize: 10, color: "#9CA3AF", marginBottom: 4 }}>{stat.label}</div>
                <div style={{ fontSize: i === 0 ? 20 : 15, fontWeight: 700, color: stat.color }}>{stat.value}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Check-in CTA */}
        <div style={{
          background: "linear-gradient(135deg, #0B5E35 0%, #147244 100%)",
          borderRadius: 18,
          padding: "20px",
          display: "flex",
          alignItems: "center",
          gap: 16,
          marginBottom: 14,
          boxShadow: "0 8px 24px rgba(11,94,53,0.3)",
        }}>
          <div style={{
            width: 48,
            height: 48,
            borderRadius: 24,
            background: "rgba(255,255,255,0.15)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 24,
            flexShrink: 0,
          }}>✓</div>
          <div>
            <div style={{ color: "white", fontSize: 17, fontWeight: 700 }}>تم تسجيل الحضور</div>
            <div style={{ color: "rgba(255,255,255,0.7)", fontSize: 12, marginTop: 3 }}>
              الموقع مُسجَّل · ٢١ يوليو ٢٠٢٦
            </div>
          </div>
          <div style={{ marginRight: "auto" }}>
            <div style={{
              background: "#FFD700",
              borderRadius: 8,
              padding: "4px 10px",
              fontSize: 12,
              fontWeight: 700,
              color: "#0B5E35",
            }}>✓</div>
          </div>
        </div>

        {/* Quick access */}
        <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
          {[
            { emoji: "📋", label: "سجل الحضور", bg: "#F0FDF4", border: "#BBF7D0", color: "#0B5E35" },
            { emoji: "🌴", label: "إجازاتي", bg: "#FFFBEB", border: "#FDE68A", color: "#92400E" },
            { emoji: "📢", label: "الإعلانات", bg: "#EFF6FF", border: "#BFDBFE", color: "#1D4ED8" },
          ].map((item) => (
            <div key={item.label} style={{
              flex: 1,
              background: item.bg,
              borderRadius: 16,
              border: `1px solid ${item.border}`,
              padding: "14px 8px",
              textAlign: "center",
            }}>
              <div style={{ fontSize: 24, marginBottom: 6 }}>{item.emoji}</div>
              <div style={{ fontSize: 11, color: item.color, fontWeight: 600 }}>{item.label}</div>
            </div>
          ))}
        </div>

        {/* Announcement */}
        <div style={{
          background: "white",
          borderRadius: 14,
          padding: 16,
          display: "flex",
          gap: 12,
          alignItems: "center",
          borderRight: "4px solid #FFD700",
          boxShadow: "0 2px 10px rgba(0,0,0,0.05)",
        }}>
          <div style={{ fontSize: 24 }}>📢</div>
          <div>
            <div style={{ fontSize: 11, color: "#92400E", fontWeight: 700, marginBottom: 3 }}>إعلان جديد</div>
            <div style={{ fontSize: 13, color: "#374151" }}>اجتماع الفريق يوم الأحد الساعة 10 صباحاً</div>
          </div>
        </div>
      </div>

      {/* Bottom Nav */}
      <div style={{
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        background: "white",
        borderTop: "1px solid #E5E7EB",
        padding: "10px 0 20px",
        display: "flex",
        justifyContent: "space-around",
      }}>
        {[
          { icon: "🏠", label: "الرئيسية", active: true },
          { icon: "📅", label: "الجدول" },
          { icon: "☀️", label: "إجازة" },
          { icon: "📢", label: "إعلانات" },
          { icon: "👤", label: "الملف" },
        ].map((item) => (
          <div key={item.label} style={{ textAlign: "center" }}>
            <div style={{ fontSize: 20 }}>{item.icon}</div>
            <div style={{
              fontSize: 10,
              marginTop: 3,
              color: item.active ? "#0B5E35" : "#9CA3AF",
              fontWeight: item.active ? 700 : 400,
            }}>{item.label}</div>
            {item.active && (
              <div style={{ width: 20, height: 3, borderRadius: 2, background: "#0B5E35", margin: "3px auto 0" }} />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
