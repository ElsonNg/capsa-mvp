import Image from "next/image";

const toneClasses = {
  blue: "bg-[#d0e4ff] text-[#0062a1]",
  green: "bg-[#dff6eb] text-[#087a53]",
  orange: "bg-[#fff0e8] text-[#a04100]",
};

const integrationCards: Array<{
  name: string;
  label: string;
  status: string;
  image: string;
  className: string;
  tone: keyof typeof toneClasses;
}> = [
  {
    name: "Google Drive",
    label: "Approved support policy",
    status: "Healthy",
    image: "/assets/integrations/googledrive.svg",
    className: "left-[5%] top-[10%]",
    tone: "green",
  },
  {
    name: "Read the Docs",
    label: "Published help center",
    status: "Verified",
    image: "/assets/integrations/readthedocs.svg",
    className: "right-[6%] top-[12%]",
    tone: "blue",
  },
  {
    name: "Proton Drive",
    label: "Draft refund policy",
    status: "Quarantined",
    image: "/assets/integrations/protondrive.svg",
    className: "bottom-[12%] left-[8%]",
    tone: "orange",
  },
  {
    name: "Claude",
    label: "Allowed agent",
    status: "Healthy docs only",
    image: "/assets/integrations/claude.svg",
    className: "bottom-[10%] right-[7%]",
    tone: "green",
  },
];

export function PrecisionVisualizer() {
  return (
    <div className="capsa-precision-visualizer relative isolate mx-auto min-h-[430px] w-full max-w-[720px] overflow-hidden rounded-2xl border border-[#e2e8f0] bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_18px_48px_rgba(15,23,42,0.08)] sm:min-h-[520px] sm:p-6">
      <div className="absolute inset-0 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] bg-[length:18px_18px] opacity-45" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_45%,rgba(255,106,0,0.12),transparent_32%),linear-gradient(180deg,rgba(255,255,255,0.2),rgba(248,250,252,0.72))]" />

      <svg
        aria-hidden="true"
        className="absolute inset-0 h-full w-full"
        fill="none"
        viewBox="0 0 720 520"
        preserveAspectRatio="none"
      >
        <path
          className="capsa-connector capsa-connector-a"
          d="M153 108 C246 112 283 197 360 258"
        />
        <path
          className="capsa-connector capsa-connector-b"
          d="M567 112 C478 123 434 198 360 258"
        />
        <path
          className="capsa-connector capsa-connector-c"
          d="M156 410 C235 387 282 321 360 258"
        />
        <path
          className="capsa-connector capsa-connector-d"
          d="M562 410 C477 389 431 322 360 258"
        />
      </svg>

      <div className="absolute left-1/2 top-1/2 z-20 flex h-28 w-28 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-[#ffd3bd] bg-white shadow-[0_16px_42px_rgba(160,65,0,0.18)] sm:h-36 sm:w-36">
        <span className="capsa-pulse-ring absolute h-full w-full rounded-full border border-[#ff6a00]/30" />
        <span className="capsa-pulse-ring capsa-pulse-ring-delay absolute h-full w-full rounded-full border border-[#ff6a00]/25" />
        <span className="grid h-[72px] w-[72px] place-items-center rounded-full bg-[#ff6a00] text-white shadow-[0_10px_24px_rgba(255,106,0,0.26)] sm:h-24 sm:w-24">
          <svg
            aria-hidden="true"
            className="h-9 w-9"
            fill="none"
            viewBox="0 0 24 24"
          >
            <path
              d="m6.5 12.4 3.2 3.1 7.8-7.8"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2.4"
            />
          </svg>
        </span>
        <span className="absolute -bottom-3 rounded-full border border-[#e2e8f0] bg-white px-3 py-1 text-xs font-bold text-[#a04100] shadow-sm">
          Verified
        </span>
      </div>

      {integrationCards.map((card, index) => (
        <div
          key={card.name}
          className={`capsa-float-card absolute z-10 w-[140px] rounded-xl border border-[#e2e8f0] bg-white/94 p-2.5 shadow-[0_10px_28px_rgba(15,23,42,0.08)] backdrop-blur sm:w-[204px] sm:p-4 ${card.className}`}
          style={{ animationDelay: `${index * 180}ms` }}
        >
          <div className="flex items-start gap-3">
            <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-[#e2e8f0] bg-[#f8fafc] sm:h-10 sm:w-10">
              <Image
                src={card.image}
                alt=""
                width={22}
                height={22}
                className="h-4 w-4 opacity-80 sm:h-5 sm:w-5"
              />
            </div>
            <div className="min-w-0">
              <p className="truncate text-xs font-bold text-[#191c1e] sm:text-sm">
                {card.name}
              </p>
              <p className="mt-0.5 line-clamp-2 text-[11px] font-semibold leading-4 text-[#565e74] sm:text-xs">
                {card.label}
              </p>
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between gap-2">
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-[11px] font-bold ${
                toneClasses[card.tone]
              }`}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-current" />
              {card.status}
            </span>
            <span className="h-1.5 w-1.5 rounded-full bg-[#cbd5e1]" />
          </div>
        </div>
      ))}

      <div className="absolute left-1/2 top-6 z-10 -translate-x-1/2 rounded-full border border-[#e2e8f0] bg-white/88 px-3 py-1.5 text-xs font-bold text-[#565e74] shadow-sm">
        Claim graph online
      </div>

      <style>{`
        .capsa-precision-visualizer .capsa-connector {
          stroke: rgba(160, 65, 0, 0.34);
          stroke-width: 1.6;
          stroke-linecap: round;
          stroke-dasharray: 3 8;
          animation: capsa-dash-flow 3.8s linear infinite;
        }

        .capsa-precision-visualizer .capsa-connector-b,
        .capsa-precision-visualizer .capsa-connector-d {
          stroke: rgba(0, 98, 161, 0.24);
          animation-duration: 4.4s;
        }

        .capsa-precision-visualizer .capsa-float-card {
          animation: capsa-card-drift 6.4s ease-in-out infinite;
        }

        .capsa-precision-visualizer .capsa-pulse-ring {
          animation: capsa-node-pulse 2.8s ease-out infinite;
        }

        .capsa-precision-visualizer .capsa-pulse-ring-delay {
          animation-delay: 1.1s;
        }

        @keyframes capsa-dash-flow {
          to {
            stroke-dashoffset: -44;
          }
        }

        @keyframes capsa-card-drift {
          0%,
          100% {
            transform: translateY(0);
          }

          50% {
            transform: translateY(-7px);
          }
        }

        @keyframes capsa-node-pulse {
          0% {
            opacity: 0.62;
            transform: scale(0.88);
          }

          100% {
            opacity: 0;
            transform: scale(1.32);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .capsa-precision-visualizer .capsa-connector,
          .capsa-precision-visualizer .capsa-float-card,
          .capsa-precision-visualizer .capsa-pulse-ring {
            animation: none;
          }
        }
      `}</style>
    </div>
  );
}
