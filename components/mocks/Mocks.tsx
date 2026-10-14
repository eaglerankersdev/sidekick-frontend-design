/**
 * Product UI mockups rendered in HTML/CSS so they stay crisp at any size.
 * All data shown is SAMPLE data and every mock is labelled as a preview.
 * Replace with real staging screenshots when available (brief §5 Assets).
 */
import {
  Search,
  Bell,
  LayoutDashboard,
  Users,
  FileText,
  Briefcase,
  CalendarDays,
  Receipt,
  Settings,
  Phone as PhoneIcon,
  MapPin,
  Camera,
  CheckCircle2,
  Clock,
  ChevronRight,
  Sparkles,
  Check,
  Pencil,
  X,
  Truck,
  Wifi,
  BatteryFull,
  Signal,
} from "lucide-react";
import s from "./Mocks.module.css";

export function PreviewLabel({ children = "Product preview · sample data" }: { children?: React.ReactNode }) {
  return <span className={s.previewLabel}>{children}</span>;
}

/* ---------- Browser frame ---------- */
export function Browser({ children, url = "app.sidekickcrm.com", className = "" }: { children: React.ReactNode; url?: string; className?: string }) {
  return (
    <div className={`${s.browser} ${className}`}>
      <div className={s.browserBar}>
        <span className={s.dots}>
          <i />
          <i />
          <i />
        </span>
        <span className={s.url}>{url}</span>
      </div>
      <div className={s.browserBody}>{children}</div>
    </div>
  );
}

/* ---------- Phone frame ---------- */
export function Phone({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`${s.phone} ${className}`}>
      <div className={s.phoneScreen}>
      <div className={s.phoneStatus}>
        <span>9:41</span>
        <span className={s.phoneStatusIcons}>
          <Signal aria-hidden />
          <Wifi aria-hidden />
          <BatteryFull aria-hidden />
        </span>
      </div>
      <div className={s.phoneBody}>{children}</div>
      <div className={s.phoneHome} />
      </div>
    </div>
  );
}

/* ---------- Dashboard ---------- */
export function DashboardMock({ compact = false, brand = "Workspace", mobilePreview = false }: { compact?: boolean; brand?: string; mobilePreview?: boolean }) {
  return (
    <div className={`${s.app} ${compact ? s.appCompact : ""} ${mobilePreview ? s.mobilePreview : ""}`}>
      <aside className={s.side}>
        <div className={s.sideBrand}>
          <span className={s.sideLogo}>{brand.charAt(0)}</span>
          <span>{brand}</span>
        </div>
        <nav aria-hidden>
          <span className={`${s.sideLink} ${s.sideActive}`}>
            <LayoutDashboard /> Dashboard
          </span>
          <span className={s.sideLink}>
            <Users /> Leads
          </span>
          <span className={s.sideLink}>
            <FileText /> Quotes
          </span>
          <span className={s.sideLink}>
            <Briefcase /> Jobs
          </span>
          <span className={s.sideLink}>
            <CalendarDays /> Schedule
          </span>
          <span className={s.sideLink}>
            <Receipt /> Invoices
          </span>
          <span className={s.sideLink}>
            <Settings /> Settings
          </span>
        </nav>
      </aside>
      <div className={s.main}>
        <div className={s.topbar}>
          <span className={s.search}>
            <Search /> Search leads, jobs, invoices
          </span>
          <span className={s.topIcons}>
            <Bell />
            <i className={s.avatar} />
          </span>
        </div>
        <div className={s.kpis}>
          {[
            ["New leads", "This week", "leads"],
            ["Quotes to review", "Ready for your review", "quotes"],
            ["Jobs scheduled", "Next 7 days", "jobs"],
            ["Invoices paid", "Via your Stripe", "paid"],
          ].map(([t, d, k]) => (
            <div key={t} className={s.kpi}>
              <span className={s.kpiLabel}>{t}</span>
              <span className={`${s.kpiBar} ${s[`bar_${k}`]}`} />
              <span className={s.kpiHint}>{d}</span>
            </div>
          ))}
        </div>
        <div className={s.panels}>
          <div className={s.panel}>
            <div className={s.panelHead}>
              <strong>Recent leads</strong>
              <span>Pressure Washing</span>
            </div>
            {[
              ["Driveway + walkway clean", "Website form", "New"],
              ["Two-story siding wash", "Manual entry", "Quote prepared"],
              ["Deck restoration inquiry", "Website form", "Scheduled"],
              ["Commercial lot clean", "Phone", "Assigned"],
            ].map(([t, src, st]) => (
              <div key={t} className={s.row}>
                <i className={s.rowDot} />
                <span className={s.rowTitle}>{t}</span>
                <span className={s.rowSrc}>{src}</span>
                <span className={`${s.pill} ${s[`pill_${st.split(" ")[0]}`]}`}>{st}</span>
              </div>
            ))}
          </div>
          <div className={s.panel}>
            <div className={s.panelHead}>
              <strong>Today</strong>
              <span>Crew A</span>
            </div>
            {[
              ["8:00", "Driveway clean", "Oak St"],
              ["10:30", "Siding wash", "Maple Ave"],
              ["14:00", "Deck prep", "Hill Rd"],
            ].map(([time, t, where]) => (
              <div key={t} className={s.slot}>
                <span className={s.slotTime}>{time}</span>
                <span>
                  <strong>{t}</strong>
                  <em>{where}</em>
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- Mobile job screen ---------- */
export function JobPhoneMock({ title = "Driveway + walkway clean", stage = "Washing", crew = "Crew A" }: { title?: string; stage?: string; crew?: string }) {
  return (
    <div className={s.pApp}>
      <div className={s.pHead}>
        <span>Job SK-1042</span>
        <strong>Assigned to {crew}</strong>
      </div>
      <div className={s.pCard}>
        <div className={s.pCardTop}>
          <span className={`${s.pill} ${s.pill_Scheduled}`}>{stage}</span>
          <Clock />
        </div>
        <strong className={s.pTitle}>{title}</strong>
        <span className={s.pMeta}>
          <MapPin /> 128 Oak St
        </span>
        <span className={s.pMeta}>
          <PhoneIcon /> Customer on record
        </span>
        <div className={s.pStages}>
          {["Scheduled", "On site", "In progress", "Complete"].map((st, i) => (
            <span key={st} className={`${s.pStage} ${i < 2 ? s.pStageDone : ""} ${i === 2 ? s.pStageNow : ""}`}>
              {i < 2 ? <CheckCircle2 /> : <i />}
              {st}
            </span>
          ))}
        </div>
        <div className={s.pActions}>
          <span className={s.pBtnGhost}>
            <Camera /> Add photo
          </span>
          <span className={s.pBtn}>Update status</span>
        </div>
      </div>
      <div className={s.pList}>
        <span className={s.pListHead}>Next up</span>
        {["Siding wash · Maple Ave", "Deck prep · Hill Rd"].map((t) => (
          <span key={t} className={s.pListRow}>
            {t} <ChevronRight />
          </span>
        ))}
      </div>
    </div>
  );
}

/* ---------- Lead record ---------- */
export function LeadRecordMock({ fields, service }: { fields: string[]; service: string }) {
  return (
    <div className={s.record}>
      <div className={s.recordHead}>
        <div>
          <span className={s.recordKicker}>Lead · {service}</span>
          <strong>Request from website form</strong>
        </div>
        <span className={`${s.pill} ${s.pill_New}`}>New</span>
      </div>
      <div className={s.recordGrid}>
        {fields.map((f) => (
          <div key={f} className={s.field}>
            <span className={s.fieldLabel}>{f}</span>
            <span className={s.fieldValue} />
          </div>
        ))}
      </div>
      <div className={s.recordFoot}>
        <span>Assigned: unassigned</span>
        <span>Source: website</span>
        <span>Status: new</span>
      </div>
    </div>
  );
}

/* ---------- Quote / estimate ---------- */
export function QuoteMock({ title = "Estimate", lines }: { title?: string; lines: [string, string][] }) {
  return (
    <div className={s.quote}>
      <div className={s.quoteHead}>
        <strong>{title}</strong>
        <span className={`${s.pill} ${s.pill_Quote}`}>Draft · not sent</span>
      </div>
      {lines.map(([l, r]) => (
        <div key={l} className={s.quoteLine}>
          <span>{l}</span>
          <span className={s.quoteVal}>{r}</span>
        </div>
      ))}
      <div className={s.quoteRule} />
      <div className={s.quoteFoot}>
        <span>Price rules: provider-approved</span>
        <span className={s.quoteSend}>Send when ready</span>
      </div>
    </div>
  );
}

/* ---------- Stage timeline ---------- */
export function TimelineMock({ stages, done = 2, example = false }: { stages: string[]; done?: number; example?: boolean }) {
  return (
    <div className={s.timeline}>
      {example && <span className={s.exampleTag}>Example stages</span>}
      {stages.map((st, i) => (
        <div key={st} className={`${s.tRow} ${i < done ? s.tDone : ""} ${i === done ? s.tNow : ""}`}>
          <span className={s.tDot}>{i < done ? <Check /> : null}</span>
          <span className={s.tLabel}>{st}</span>
          <span className={s.tMeta}>{i < done ? "Done" : i === done ? "In progress" : "Upcoming"}</span>
        </div>
      ))}
    </div>
  );
}

/* ---------- Dispatch board ---------- */
export function DispatchMock() {
  const cols: [string, string[]][] = [
    ["New", ["Sedan tow · Main St", "Flat tire assist"]],
    ["Assigned", ["SUV tow · Rt 9"]],
    ["In progress", ["Box truck recovery"]],
  ];
  return (
    <div className={s.board}>
      {cols.map(([c, cards]) => (
        <div key={c} className={s.col}>
          <span className={s.colHead}>
            {c} <em>{cards.length}</em>
          </span>
          {cards.map((card) => (
            <div key={card} className={s.bCard}>
              <strong>{card}</strong>
              <span>
                <Truck /> Truck 2 · Driver J.
              </span>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

/* ---------- Before / after ---------- */
export function BeforeAfterMock() {
  return (
    <div className={s.ba}>
      <div className={`${s.baPane} ${s.baBefore}`}>
        <span>Before</span>
        <i />
        <i />
        <i />
      </div>
      <div className={`${s.baPane} ${s.baAfter}`}>
        <span>After</span>
        <CheckCircle2 />
      </div>
    </div>
  );
}

/* ---------- Proposal ---------- */
export function ProposalMock() {
  return (
    <div className={s.proposal}>
      <div className={s.propSide}>
        <span className={s.propSideHead}>Style</span>
        <span className={s.propSwatches}>
          <i style={{ background: "#002052" }} />
          <i style={{ background: "#0062FD" }} />
          <i style={{ background: "#87B5FF" }} />
          <i style={{ background: "#E6F0FF" }} />
        </span>
        <span className={s.propSideHead}>Sections</span>
        {["Cover", "Scope", "Pricing", "Signature"].map((x) => (
          <span key={x} className={s.propSec}>
            {x}
          </span>
        ))}
      </div>
      <div className={s.propPage}>
        <span className={s.propLogo} />
        <strong>Exterior repaint proposal</strong>
        <span className={s.propLine} style={{ width: "80%" }} />
        <span className={s.propLine} style={{ width: "92%" }} />
        <span className={s.propLine} style={{ width: "64%" }} />
        <div className={s.propImgs}>
          <i />
          <i />
        </div>
        <span className={s.propSign}>Sign here</span>
      </div>
    </div>
  );
}

/* ---------- AI suggestion panel ---------- */
export function AISuggestionMock() {
  return (
    <div className={s.ai}>
      <div className={s.aiIn}>
        <span className={s.aiLabel}>You typed</span>
        <strong>"We clean driveways, roofs and commercial lots."</strong>
      </div>
      <div className={s.aiOut}>
        <span className={s.aiLabel}>
          <Sparkles /> Suggested fields
        </span>
        {["Surface type", "Approx. area (sq ft)", "Access notes"].map((f) => (
          <div key={f} className={s.aiRow}>
            <span>{f}</span>
            <span className={s.aiBtns}>
              <i className={s.aiAccept}>
                <Check /> Accept
              </i>
              <i>
                <Pencil /> Edit
              </i>
              <i>
                <X /> Ignore
              </i>
            </span>
          </div>
        ))}
        <span className={s.aiNote}>Nothing changes until you accept it.</span>
      </div>
    </div>
  );
}

/* ---------- Website builder before/after ---------- */
export function BuilderMock() {
  return (
    <div className={s.builder}>
      <div className={s.builderSteps}>
        {["Logo", "Colors", "Fonts", "Hero", "Sections", "Preview", "Publish"].map((x, i) => (
          <span key={x} className={`${s.bStep} ${i < 3 ? s.bStepDone : ""} ${i === 3 ? s.bStepNow : ""}`}>
            {x}
          </span>
        ))}
      </div>
      <div className={s.builderCanvas}>
        <span className={s.bNav}>
          <i />
          <em />
          <em />
          <em />
        </span>
        <span className={s.bHero}>
          <strong>Your business name</strong>
          <span />
          <b>Request a quote</b>
        </span>
        <span className={s.bCards}>
          <i />
          <i />
          <i />
        </span>
      </div>
    </div>
  );
}

/* ---------- Invoice ---------- */
export function InvoiceMock() {
  return (
    <div className={s.invoice}>
      <div className={s.invHead}>
        <strong>Invoice</strong>
        <span className={`${s.pill} ${s.pill_Paid}`}>Paid</span>
      </div>
      <span className={s.invLine} />
      <span className={s.invLine} style={{ width: "70%" }} />
      <div className={s.invFoot}>
        <span>Paid via your Stripe account</span>
        <CheckCircle2 />
      </div>
    </div>
  );
}
