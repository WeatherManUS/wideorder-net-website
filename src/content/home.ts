export type NavItem = {
  label: string;
  href: string;
};

export type ProcessStage = {
  title: string;
  paragraphs: readonly string[];
  outcomes?: readonly string[];
};

export type DeliveryMode = {
  title: string;
  body: string;
};

export type ProofStory = {
  title: string;
  challenge: string;
  betterWay: string;
  result: string;
  interpretation: string;
};

export type ContactField = {
  label: string;
  name: string;
  type?: "text" | "email" | "tel";
  autoComplete?: string;
  required?: boolean;
};

export const homeContent = {
  navItems: [
    { label: "The Challenge", href: "#the-challenge" },
    { label: "How We Work", href: "#how-we-work" },
    { label: "Delivery", href: "#delivery" },
    { label: "Value", href: "#value" },
  ] as const satisfies readonly NavItem[],
  primaryCta: {
    label: "Email WideOrder",
    href: "#contact",
  },
  hero: {
    serviceName: "WideOrder",
    brandPromise: "Practical business problem solving",
    statement: "WideOrder fixes problems for businesses.",
    supportingCopy:
      "When something in the business causes pain, wastes time, creates unnecessary work, keeps going wrong, or simply needs to get done properly, WideOrder helps define the real problem and get the right solution delivered.",
    examples: [
      "A report that takes hours",
      "Data entered twice",
      "A weekly rebuild",
      "A recurring workaround",
      "Errors and rework",
      "Only one person knows how",
      "Systems that almost connect",
      "A task nobody fixes",
    ],
  },
  challenge: {
    statement: "Businesses accumulate work that should not be this hard.",
    examples: [
      "A process that keeps creating unnecessary work.",
      "A recurring task that consumes attention every week.",
      "A workflow that breaks whenever a particular person is away.",
      "A system that almost solves the problem but still leaves gaps.",
      "A piece of work that keeps going wrong, slowly, or both.",
      "A job everyone knows should be easier, but nobody has had time to solve properly.",
    ],
    qualification:
      "Sometimes the issue is obvious. Sometimes all you know is that time keeps disappearing into work that should not need this much effort.",
  },
  positioning: {
    statement: "Not a traditional consultancy.",
    body:
      "WideOrder works more like a practical business fixer: understand what is really happening, determine what will create meaningful value, and make sure the right solution gets delivered.",
    lineOne: "No predetermined answer.",
    lineTwo: "Start with the problem.",
  },
  howWeWork: {
    statement: "Discovery first. Then the right path.",
    stages: [
      {
        title: "Start with what is not working",
        paragraphs: [
          "A client may know exactly what the problem is, or may only know that something keeps taking too long, going wrong, or creating unnecessary effort.",
        ],
      },
      {
        title: "Discovery",
        paragraphs: [
          "WideOrder looks at what is happening on the ground. That can include mapping the process step by step, understanding how much time the work consumes, where errors or repetition show up, and where the business depends on particular people, systems, or knowledge.",
        ],
        outcomes: [
          "What is actually causing the problem?",
          "Can WideOrder create meaningful value by addressing it?",
        ],
      },
      {
        title: "Decide what is worth doing",
        paragraphs: [
          "The solution is not predetermined. WideOrder does not begin by trying to sell software, automation, AI, outsourcing, or consulting hours. The right answer may be process change, better use of an existing capability, a specialist implementation, ongoing support, or something much simpler.",
        ],
      },
      {
        title: "Get it delivered",
        paragraphs: [
          "Once the right path is clear, WideOrder helps make sure the work is implemented properly and actually works in the real business environment.",
        ],
      },
    ] as const satisfies readonly ProcessStage[],
  },
  principle: {
    lineOne: "The solution is not predetermined.",
    lineTwo: "The value should materially outweigh the cost.",
    body: "The point is not to sell a tool. The point is to leave the client materially better off.",
  },
  delivery: {
    statement: "Delivery depends on what will actually work.",
    introduction:
      "WideOrder does not need to personally perform every component of a solution. The responsibility is making sure the problem is understood and the right response gets delivered well.",
    modes: [
      {
        title: "Direct execution",
        body: "WideOrder can implement or perform the work directly where that is the most practical solution.",
      },
      {
        title: "Managed implementation",
        body: "WideOrder can identify the right specialist or provider, define what needs to be achieved, and manage the process through completion.",
      },
      {
        title: "Ongoing service",
        body: "Where the underlying need is recurring rather than removable, WideOrder can remain involved with the expertise, systems, manpower, or management needed to handle it properly.",
      },
    ] as const satisfies readonly DeliveryMode[],
  },
  value: {
    statement: "Only worth doing if the client is materially better off.",
    introduction:
      "Value can show up in different ways. It does not always need to be reduced to a perfect spreadsheet, but there should be a credible case that the benefit meaningfully exceeds the cost.",
    points: [
      "Increased revenue",
      "Reduced costs",
      "Recovered employee or management time",
      "Greater capacity",
      "Fewer mistakes and less rework",
      "Reduced operational risk",
      "Less dependency on particular individuals",
      "Removal of an ongoing burden from the client",
    ],
  },
  boundaries: {
    statement: "Broad scope, clear specialist boundaries.",
    body:
      "WideOrder is willing to investigate a very broad range of business problems. Where licensed, regulated, medical, engineering, legal, or other specialist expertise is required, WideOrder does not pretend to possess it.",
    note: "Instead, WideOrder identifies the requirement, involves the right specialist where needed, and manages the broader process where appropriate.",
  },
  contact: {
    statement: "Start with the problem.",
    body: "Send a short email describing what is taking too long, keeps going wrong, or feels harder than it should. A few lines is enough.",
    emailLabel: "Email",
    buttonLabel: "Email WideOrder",
    prompts: [
      "What is happening now?",
      "What keeps consuming time or attention?",
      "What should be easier than it is?",
    ],
  },
  footer: {
    identity: ["WideOrder", "WideOrder fixes problems for businesses.", "A GreenLangton company"],
    philosophy: "The point is a better outcome, not a predetermined tool.",
    navItems: [
      { label: "The Challenge", href: "#the-challenge" },
      { label: "How We Work", href: "#how-we-work" },
      { label: "Delivery", href: "#delivery" },
      { label: "Value", href: "#value" },
      { label: "Contact", href: "#contact" },
    ] as const satisfies readonly NavItem[],
  },
} as const;
