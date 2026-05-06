export const academyIntro = {
  title: "Learn safer electrical decisions before work begins",
  subtitle:
    "Practical electrical learning for homeowners, business owners, and beginners who want clearer decisions before installation, repair, or solar planning.",
  lead: [
    "The academy is built to help clients understand safety, load planning, lighting decisions, solar backup, and project preparation in plain language.",
    "Use the tracks below as a starting point before requesting a quote, asking the assistant a question, or preparing details for a site visit.",
  ],
} as const;

export const academyAudiences = [
  {
    label: "For homeowners",
    title: "Understand the basics before work begins",
    summary:
      "A simple lane for clients who want to understand safety, load planning, and better installation decisions before requesting service.",
  },
  {
    label: "For business owners",
    title: "Reduce guesswork in electrical planning",
    summary:
      "Useful for shops, offices, and property operators who need clearer decisions around backup power, CCTV, and maintenance readiness.",
  },
  {
    label: "For learners",
    title: "Build confidence in electrical fundamentals",
    summary:
      "A beginner-friendly structure for aspiring technicians or apprentices who need discipline, terminology, and site awareness.",
  },
] as const;

export const academyTracks = [
  {
    title: "Home Electrical Safety Basics",
    level: "Starter",
    duration: "3 short lessons",
    audience: "Homeowners",
    summary:
      "A basic track that explains common household risk points, safe usage habits, and what to check before calling for correction work.",
    modules: [
      "Recognizing overload signs and recurring fault patterns",
      "Safe extension use, socket awareness, and quick home checks",
      "When a small symptom needs professional attention",
    ],
    outcome: "Ask better questions and spot problems earlier.",
  },
  {
    title: "Solar and Inverter Planning Fundamentals",
    level: "Core",
    duration: "4 short lessons",
    audience: "Homeowners",
    summary:
      "A practical planning lane for load estimation, backup expectations, battery sizing thinking, and system maintenance habits.",
    modules: [
      "Critical loads versus total loads",
      "How backup hours affect battery and inverter decisions",
      "Simple maintenance habits that protect system lifespan",
    ],
    outcome: "Prepare clearer expectations before a solar or inverter quote.",
  },
  {
    title: "Electrical Trade Readiness",
    level: "Foundation",
    duration: "5 short lessons",
    audience: "Learners",
    summary:
      "A structured beginner path that introduces electrical discipline, safety culture, and what good site execution looks like.",
    modules: [
      "Basic site etiquette and tool handling",
      "Clean routing, neat finishing, and labeling habits",
      "Protection thinking and why shortcuts create future faults",
    ],
    outcome: "Build better site awareness before practical training or apprenticeship work.",
  },
] as const;

export const academyResources = [
  {
    type: "Checklist",
    status: "Available soon",
    title: "Pre-quote project checklist",
    summary:
      "A downloadable checklist covering location, service type, load notes, and photos clients should gather before requesting a quote.",
  },
  {
    type: "Guide",
    status: "Available soon",
    title: "Homeowner safety starter guide",
    summary:
      "A short educational guide that helps clients understand overload warning signs, maintenance timing, and safe appliance behavior.",
  },
  {
    type: "Mini class",
    status: "Planned",
    title: "Solar sizing explained simply",
    summary:
      "A short class or video series that translates sizing concepts into plain language for first-time solar buyers.",
  },
  {
    type: "Workshop",
    status: "Planned",
    title: "Beginner electrical workshop announcements",
    summary:
      "A slot for future training dates, workshop invitations, or apprentice-facing sessions without changing the page structure.",
  },
] as const;

export const academyOutcomes = [
  {
    title: "Higher trust before contact",
    summary:
      "Teaching-first content makes the business feel more competent and lowers the pressure of the first interaction.",
  },
  {
    title: "Better qualified leads",
    summary:
      "People arrive with stronger context, clearer scope, and more realistic expectations around timelines and pricing.",
  },
  {
    title: "Room to scale content later",
    summary:
      "The academy can grow into lessons, downloads, events, and article series as client questions become clearer.",
  },
] as const;
