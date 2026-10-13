import type { FeatureKey } from "./feature-availability";

export type IndustrySlug = "pressure-washing" | "concrete-sealing" | "towing" | "junk-removal" | "painting";

export type IndustrySection = {
  title: string;
  body: string;
  bullets?: string[];
  status?: FeatureKey;
  note?: string;
};

export type Industry = {
  slug: IndustrySlug;
  name: string;
  navName: string;
  icon: string;
  seoTitle: string;
  seoDescription: string;
  heroTitle: string;
  heroAccent: string;
  intro: string;
  cardBlurb: string;
  /** Fields the branded request form asks for (switcher + hero preview). */
  formFields: string[];
  /** Example workflow stages, shown in previews. */
  stages: string[];
  stagesAreExamples?: boolean;
  /** Preview record shown in the switcher. Clearly sample data. */
  sample: { title: string; service: string; detail: string; crew: string };
  sections: IndustrySection[];
  visual: "estimate" | "timeline" | "dispatch" | "beforeAfter" | "proposal";
  cta: string;
  guardrail: string;
};

export const industries: Industry[] = [
  {
    slug: "pressure-washing",
    name: "Pressure Washing",
    navName: "Pressure Washing",
    icon: "droplets",
    seoTitle: "Pressure Washing CRM | SideKick CRM",
    seoDescription:
      "Organize pressure-washing requests, build quotes your way, schedule crews and follow through on payment with SideKick CRM.",
    heroTitle: "From the first wash request",
    heroAccent: "to the final invoice.",
    intro:
      "Keep driveway, exterior and other pressure-washing inquiries organized, build a quote your way, schedule the work and follow through on payment.",
    cardBlurb: "Driveways, siding and exterior cleaning requests, quoted your way.",
    formFields: ["Contact details", "Cleaning service", "Property address", "Optional photos"],
    stages: ["New request", "Quote prepared", "Scheduled", "Washing", "Completed", "Invoiced"],
    sample: { title: "Driveway + walkway clean", service: "Pressure Washing", detail: "Manual area entry", crew: "Crew A" },
    visual: "estimate",
    sections: [
      {
        title: "Capture requests",
        body: "A branded form collects what you need up front, and every submission becomes a lead in your CRM.",
        bullets: ["Contact details and property address", "Requested cleaning service", "Optional photos of the surfaces"],
      },
      {
        title: "Lead workspace",
        body: "Each request has its own record with status, assignment, source, notes and communication history.",
      },
      {
        title: "Prepare the estimate",
        body: "Enter the area or square footage yourself and apply the price rules you approved. Customers never receive an automatic price unless you separately set that up.",
        status: "quotes",
      },
      {
        title: "Area verification concept",
        body: "An optional map-assisted surface outline that you verify before quoting is under specification.",
        status: "areaVerification",
        note: "Address-only automatic driveway measurement is not offered.",
      },
      {
        title: "Schedule and complete",
        body: "Create the job when you are ready, assign a crew, and track work status with relevant attachments.",
        status: "scheduling",
      },
      {
        title: "Invoice and payment",
        body: "Create the invoice in the CRM and collect payment through your own Stripe account. Paid status syncs back to the right lead.",
        status: "stripeInvoices",
      },
    ],
    cta: "See Pressure Washing Demo",
    guardrail: "This is SideKick's first demo industry. Measurement automation is not part of the current product.",
  },
  {
    slug: "concrete-sealing",
    name: "Concrete Sealing",
    navName: "Concrete Sealing",
    icon: "layers",
    seoTitle: "Concrete Sealing CRM | SideKick CRM",
    seoDescription:
      "Track concrete sealing jobs from the first surface inquiry through preparation, application and inspection in one place.",
    heroTitle: "Keep every step of",
    heroAccent: "the sealing job in view.",
    intro:
      "From the initial surface inquiry through preparation and completion, give your team one place to track the job.",
    cardBlurb: "Multi-step sealing work, tracked from prep through inspection.",
    formFields: ["Service request", "Property details", "Surface photos", "Contact information"],
    stages: ["Cleaning", "Drying", "Repairs", "Application", "Curing", "Inspection"],
    stagesAreExamples: true,
    sample: { title: "Patio reseal", service: "Concrete Sealing", detail: "6 example stages", crew: "Crew B" },
    visual: "timeline",
    sections: [
      {
        title: "Lead intake",
        body: "Collect the service request, property details, relevant photos and contact information in one submission.",
      },
      {
        title: "Review and quote",
        body: "Review measurements, work scope and pricing details yourself before anything goes to the customer.",
        status: "quotes",
      },
      {
        title: "Stage-based work",
        body: "Break the job into steps your team can follow and update.",
        bullets: ["Cleaning", "Drying", "Repairs", "Application", "Curing", "Inspection"],
        note: "Example stages shown. Final stages depend on the completed industry setup.",
      },
      {
        title: "Schedule crews and steps",
        body: "Crews and equipment come from the shared business resource model, while each job keeps its service-specific stages.",
        status: "scheduling",
      },
      {
        title: "Photos and job notes",
        body: "Keep work evidence attached to the correct job so the office and the crew see the same record.",
      },
      {
        title: "Invoice and follow-up",
        body: "Create the invoice in the CRM and see payment status without switching tools.",
        status: "invoices",
      },
    ],
    cta: "Discuss Concrete Sealing",
    guardrail: "SideKick does not make automatic weather or curing decisions or supply material formulas.",
  },
  {
    slug: "towing",
    name: "Towing Services",
    navName: "Towing",
    icon: "truck",
    seoTitle: "Towing Services CRM | SideKick CRM",
    seoDescription:
      "Organize towing inquiries, assign available drivers and trucks, and keep work status visible from dispatch to completion.",
    heroTitle: "From incoming request",
    heroAccent: "to assigned tow.",
    intro:
      "Organize towing inquiries, assign available people and vehicles, and keep work status visible from dispatch to completion.",
    cardBlurb: "Requests, drivers and trucks on one shared board.",
    formFields: ["Contact", "Pickup location", "Drop-off location", "Vehicle details"],
    stages: ["New", "Assigned", "En route", "In progress", "Completed"],
    sample: { title: "Sedan tow request", service: "Towing", detail: "Driver + truck assigned", crew: "Truck 2" },
    visual: "dispatch",
    sections: [
      {
        title: "Request intake",
        body: "Capture contact details, pickup and drop-off information and the vehicle details your team needs.",
      },
      {
        title: "Towing lead queue",
        body: "Authorized staff see new, assigned and in-progress requests at a glance.",
        status: "leads",
      },
      {
        title: "Dispatch workflow",
        body: "Assign a driver and a truck from the shared resource model so the same truck is never double-booked.",
        status: "dispatchBoard",
      },
      {
        title: "Work progress",
        body: "Status updates, notes and attachments stay on the job record.",
      },
      {
        title: "Quote and invoice",
        body: "You control pricing, and invoices are created in the CRM first.",
        status: "invoices",
      },
      {
        title: "Mobile visibility",
        body: "Drivers see their assigned work and update the statuses they are permitted to change.",
        status: "mobileApp",
      },
    ],
    cta: "Explore Towing Workflow",
    guardrail: "GPS tracking, route optimization, impound management and emergency dispatch guarantees are not offered.",
  },
  {
    slug: "junk-removal",
    name: "Junk Removal",
    navName: "Junk Removal",
    icon: "package-open",
    seoTitle: "Junk Removal CRM | SideKick CRM",
    seoDescription:
      "Collect job details and photos, prepare a quote, assign the team and track each junk removal request through completion.",
    heroTitle: "Less time sorting requests.",
    heroAccent: "More time clearing the job.",
    intro:
      "Collect job details and photos, prepare a quote, assign the team and track each removal request through completion.",
    cardBlurb: "Photo-rich requests turned into scheduled pickups.",
    formFields: ["Contact", "Pickup address", "Type of items", "Optional photos"],
    stages: ["Request", "Quote review", "Scheduled", "On site", "Cleared", "Invoiced"],
    sample: { title: "Garage clear-out", service: "Junk Removal", detail: "Photos attached", crew: "Crew C" },
    visual: "beforeAfter",
    sections: [
      {
        title: "Quote request",
        body: "The form asks for contact details, address, the type of items and optional photos.",
      },
      {
        title: "Organized leads",
        body: "Separate inquiries stay separate, even when they come from the same contact.",
        status: "leads",
      },
      {
        title: "Quote review",
        body: "You choose how to estimate and when to send.",
        status: "quotes",
        note: "Detailed volume and item pricing rules are still being specified.",
      },
      {
        title: "Assign the work",
        body: "Schedule crews and resources and move the job through its stages.",
        status: "scheduling",
      },
      {
        title: "On-site updates",
        body: "Crews add photos, notes and status changes from their phones.",
        status: "mobileApp",
      },
      {
        title: "Invoice and payment",
        body: "Send a connected Stripe invoice and see accurate payment status on the job.",
        status: "stripeInvoices",
      },
    ],
    cta: "See Junk Removal Demo",
    guardrail: "SideKick does not price jobs from uploaded photos.",
  },
  {
    slug: "painting",
    name: "Painting",
    navName: "Painting",
    icon: "paintbrush",
    seoTitle: "Painting Contractor CRM | SideKick CRM",
    seoDescription:
      "From the first painting inquiry to a polished proposal and scheduled crew, keep every project detail in one place.",
    heroTitle: "Win the project.",
    heroAccent: "Organize the work.",
    intro:
      "From the first painting inquiry to a polished proposal and scheduled crew, keep your project details in one place.",
    cardBlurb: "Polished proposals and planned crews for every project.",
    formFields: ["Customer details", "Property", "Painting work requested", "Reference photos"],
    stages: ["Inquiry", "Scope review", "Proposal sent", "Scheduled", "Painting", "Complete"],
    sample: { title: "Exterior repaint", service: "Painting", detail: "Proposal in review", crew: "Crew D" },
    visual: "proposal",
    sections: [
      {
        title: "Capture the inquiry",
        body: "Collect customer details, property information, the painting work requested and reference photos.",
      },
      {
        title: "Scope and quote",
        body: "Review surfaces and preparation details, then price the job with your approved rules.",
        status: "quotes",
      },
      {
        title: "Professional proposal",
        body: "Edit scope, images, colors and fonts, then request a signature.",
        status: "proposalEditor",
      },
      {
        title: "Crew scheduling",
        body: "Plan dates, set job stages and assign crews and resources.",
        status: "scheduling",
      },
      {
        title: "Project updates",
        body: "Progress, photos and notes stay linked to the job.",
      },
      {
        title: "Invoice",
        body: "Create the invoice in the CRM and track payment status from your own Stripe account.",
        status: "stripeInvoices",
      },
    ],
    cta: "Explore Painting CRM",
    guardrail: "Room measurement and material estimation formulas are not part of the current product.",
  },
];

export const industryBySlug = (slug: IndustrySlug) => industries.find((i) => i.slug === slug)!;
