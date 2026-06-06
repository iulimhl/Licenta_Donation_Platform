import { colors } from "../../styles/theme";

export default function SectionBanner({
  title,
  subtitle,
  stats = [],
  actions = null,
}) {
  const hasStats = stats.length > 0;

  return (
    <section
      style={{
        width: "100%",
        padding: hasStats ? "48px 24px" : "56px 24px",
        boxSizing: "border-box",
        backgroundColor: colors.heroMid,
        backgroundImage: `
          radial-gradient(rgba(255,255,255,0.10) 1.4px, transparent 1.4px),
          linear-gradient(135deg, ${colors.heroStart} 0%, ${colors.heroMid} 50%, ${colors.heroEnd} 100%)
        `,
        backgroundSize: "30px 30px, 100% 100%",
        backgroundPosition: "0 0, 0 0",
        display: "flex",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: hasStats ? "1000px" : "900px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center",
        }}
      >
        <h1
          style={{
            margin: "0 0 16px 0",
            fontSize: hasStats ? "46px" : "48px",
            lineHeight: 1.1,
            fontWeight: 900,
            letterSpacing: "-0.02em",
            color: "#ffffff",
          }}
        >
          {title}
        </h1>

        {subtitle && (
          <p
            style={{
              margin: actions || hasStats ? "0 0 36px 0" : 0,
              fontSize: hasStats ? "18px" : "17px",
              lineHeight: 1.6,
              color: "rgba(255,255,255,0.85)",
              maxWidth: "900px",
            }}
          >
            {subtitle}
          </p>
        )}

        {actions && (
          <div
            style={{
              display: "flex",
              gap: "16px",
              flexWrap: "wrap",
              justifyContent: "center",
              marginBottom: hasStats ? "60px" : 0,
            }}
          >
            {actions}
          </div>
        )}

        {hasStats && (
          <div
            style={{
              display: "flex",
              gap: "50px",
              alignItems: "center",
              justifyContent: "center",
              flexWrap: "wrap",
            }}
          >
            {stats.map((stat, index) => (
              <div
                key={stat.label}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "50px",
                }}
              >
                <div style={{ textAlign: "center" }}>
                  <div
                    style={{
                      fontSize: "44px",
                      fontWeight: 800,
                      color: "#ffffff",
                      marginBottom: "4px",
                    }}
                  >
                    {stat.value}
                  </div>
                  <div
                    style={{
                      fontSize: "13px",
                      fontWeight: 600,
                      textTransform: "uppercase",
                      letterSpacing: "0.08em",
                      color: "rgba(255,255,255,0.7)",
                    }}
                  >
                    {stat.label}
                  </div>
                </div>

                {index !== stats.length - 1 && (
                  <div
                    style={{
                      width: "2px",
                      height: "50px",
                      backgroundColor: "rgba(255,255,255,0.15)",
                    }}
                  />
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}