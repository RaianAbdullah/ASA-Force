export function PremiumDark() {
  return (
    <div
      style={{
        width: 390,
        height: 820,
        background: "#080D1A",
        fontFamily: "'Segoe UI', system-ui, sans-serif",
        direction: "rtl",
        overflow: "hidden",
        position: "relative",
        color: "white",
      }}
    >
      {/* Status bar */}
      <div style={{
        padding: "12px 20px 8px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}>
        <span style={{ color: "white", fontSize: 13, fontWeight: 600 }}>9:41</span>
        <div style={{ display: "flex", gap: 5, alignItems: "center" }}>
          <svg width="15" height="11" viewBox="0 0 16 12" fill="rgba(255,255,255,0.85)">
            <rect x="0" y="3" width="3" height="9" rx="1" />
            <rect x="4.5" y="2" width="3" height="10" rx="1" />
            <rect x="9" y="0" width="3" height="12" rx="1" />
            <rect x="13.5" y="1" width="2.5" height="11" rx="1" opacity="0.4" />
          </svg>
          <div style={{
            background: "rgba(255,255,255,0.2)",
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
      <div style={{ padding: "8px 20px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{
            width: 48,
            height: 48,
            borderRadius: 24,
            background: "linear-gradient(135deg, #4F8EF7, #7B5CF0)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 20,
            fontWeight: 700,
          }}>ر</div>
          <div>
            <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 12 }}>صباح الخير 👋</div>
            <div style={{ color: "white", fontSize: 17, fontWeight: 700, marginTop: 2 }}>ريان أبوطالب</div>
          </div>
        </div>
        <div style={{
          width: 40,
          height: 40,
          borderRadius: 20,
          background: "rgba(255,255,255,0.08)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 18,
        }}>🔔</div>
      </div>

      {/* Date chip */}
      <div style={{ padding: "0 20px 16px" }}>
        <span style={{
          background: "rgba(79,142,247,0.15)",
          border: "1px solid rgba(79,142,247,0.3)",
          borderRadius: 20,
          padding: "6px 14px",
          fontSize: 12,
          color: "#4F8EF7",
          fontWeight: 500,
        }}>الثلاثاء، ٢١ يوليو ٢٠٢٦</span>
      </div>

      {/* Main card */}
      <div style={{ padding: "0 16px" }}>
        <div style={{
          background: "linear-gradient(135deg, #1A2640 0%, #0F1A2E 100%)",
          borderRadius: 24,
          padding: 22,
          border: "1px solid rgba(79,142,247,0.2)",
          marginBottom: 14,
          position: "relative",
          overflow: "hidden",
        }}>
          {/* Glow effect */}
          <div style={{
            position: "absolute",
            top: -40,
            right: -40,
            width: 120,
            height: 120,
            borderRadius: "50%",
            background: "rgba(79,142,247,0.12)",
            filter: "blur(30px)",
          }} />

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20, position: "relative" }}>
            <div>
              <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 12, marginBottom: 6 }}>حالة اليوم</div>
              <div style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                background: "rgba(34,197,94,0.15)",
                border: "1px solid rgba(34,197,94,0.3)",
                borderRadius: 20,
                padding: "5px 12px",
              }}>
                <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#22C55E" }} />
                <span style={{ color: "#22C55E", fontSize: 13, fontWeight: 600 }}>حاضر</span>
              </div>
            </div>
            <div style={{ textAlign: "left", direction: "ltr" }}>
              <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 11 }}>وقت الحضور</div>
              <div style={{ color: "#4F8EF7", fontSize: 22, fontWeight: 700 }}>07:58</div>
            </div>
          </div>

          {/* Stats row */}
          <div style={{ display: "flex", gap: 10, position: "relative" }}>
            {[
              { label: "ساعات العمل", value: "04:23" },
              { label: "الوردية", value: "08–16" },
              { label: "الشهر", value: "18 يوم" },
            ].map((s) => (
              <div key={s.label} style={{
                flex: 1,
                background: "rgba(255,255,255,0.05)",
                borderRadius: 14,
                padding: "12px 8px",
                textAlign: "center",
              }}>
                <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 10, marginBottom: 4 }}>{s.label}</div>
                <div style={{ color: "white", fontSize: 14, fontWeight: 700 }}>{s.value}</div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA — recorded */}
        <div style={{
          background: "linear-gradient(135deg, #4F8EF7 0%, #7B5CF0 100%)",
          borderRadius: 18,
          padding: "18px 20px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 12,
          marginBottom: 14,
          boxShadow: "0 8px 32px rgba(79,142,247,0.35)",
        }}>
          <div style={{
            width: 36,
            height: 36,
            borderRadius: 18,
            background: "rgba(255,255,255,0.2)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 18,
          }}>✓</div>
          <div>
            <div style={{ color: "white", fontSize: 16, fontWeight: 700 }}>تم تسجيل الحضور</div>
            <div style={{ color: "rgba(255,255,255,0.65)", fontSize: 12, marginTop: 2 }}>الموقع مُسجَّل بنجاح</div>
          </div>
        </div>

        {/* Quick grid */}
        <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
          {[
            { icon: "📊", label: "سجل الحضور", color: "#4F8EF7" },
            { icon: "🌴", label: "الإجازات", color: "#22C55E" },
            { icon: "📢", label: "الإعلانات", color: "#F59E0B" },
          ].map((item) => (
            <div key={item.label} style={{
              flex: 1,
              background: "#0F1A2E",
              borderRadius: 16,
              padding: "16px 8px 12px",
              textAlign: "center",
              border: "1px solid rgba(255,255,255,0.07)",
            }}>
              <div style={{ fontSize: 24, marginBottom: 8 }}>{item.icon}</div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.6)", fontWeight: 500 }}>{item.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom nav */}
      <div style={{
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        background: "#0F1525",
        borderTop: "1px solid rgba(255,255,255,0.07)",
        padding: "12px 0 24px",
        display: "flex",
        justifyContent: "space-around",
        backdropFilter: "blur(20px)",
      }}>
        {[
          { icon: "⊞", label: "الرئيسية", active: true },
          { icon: "📅", label: "الجدول" },
          { icon: "☀️", label: "إجازة" },
          { icon: "📢", label: "إعلانات" },
          { icon: "👤", label: "الملف" },
        ].map((item) => (
          <div key={item.label} style={{ textAlign: "center" }}>
            <div style={{
              fontSize: 20,
              marginBottom: 3,
              opacity: item.active ? 1 : 0.4,
            }}>{item.icon}</div>
            <div style={{
              fontSize: 10,
              color: item.active ? "#4F8EF7" : "rgba(255,255,255,0.4)",
              fontWeight: item.active ? 700 : 400,
            }}>{item.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
