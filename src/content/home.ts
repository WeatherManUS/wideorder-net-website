export type NavItem = {
  label: string;
  href: string;
};

export type ProcessStage = {
  title: string;
  paragraphs: readonly string[];
  outcomes?: readonly string[];
};

export type PrincipleCard = {
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
    { label: "Philosophy", href: "#philosophy" },
    { label: "Proof", href: "#proof" },
    { label: "Engagement", href: "#engagement" },
  ] as const satisfies readonly NavItem[],
  primaryCta: {
    label: "Tell us what's taking your time",
    href: "#contact",
  },
  hero: {
    serviceName: "WideOrder Resolve",
    brandPromise: "There is a better way.",
    statement: "Stop losing time to busy work.",
    supportingCopy:
      "WideOrder Resolve looks at the work consuming your team's time, understands why it happens, and finds a practical way to make it better.",
    examples: [
      "Margin report",
      "Re-enter data",
      "Weekly rebuild",
      "Almost connected",
      "Only Dave knows how",
      "Copy / paste",
      "Reconcile",
      "Export -> import",
      "Status update",
      "Reply-all thread",
    ],
  },
  challenge: {
    statement: "Every business develops work that takes longer than it should.",
    examples: [
      "A report that takes hours to prepare.",
      "Information that has to be entered twice.",
      "A spreadsheet somebody has to rebuild every week.",
      "Systems that almost work together - but don't.",
      "A process that depends on one person knowing how to do it.",
      "A task everyone hates doing, but nobody has had the time to fix.",
    ],
    qualification:
      "These are not examples of businesses doing things incorrectly. They are natural operational challenges that develop as companies grow and change.",
  },
  anotherSetOfEyes: {
    statement: "Sometimes you need another set of eyes.",
    body:
      "WideOrder Resolve looks at the work consuming your team's time, understands why it happens, and finds a practical way to make it better.",
    lineOne: "We don't arrive with a predetermined answer.",
    lineTwo: "We start with the challenge.",
  },
  howWeWork: {
    statement: "A straightforward progression.",
    stages: [
      {
        title: "Show us the challenge",
        paragraphs: [
          "Tell us what takes too long, keeps coming back, consumes attention or simply feels harder than it should.",
        ],
      },
      {
        title: "Discovery",
        paragraphs: [
          "Before recommending a solution, we do the work required to understand the challenge properly. We look at the process, the systems, the people, the workarounds and the existing environment.",
          "Discovery is a paid professional engagement.",
          "You are paying for the expertise and time required to properly understand the challenge - not for a guaranteed solution. The outcome is clarity: what is happening, what is creating the constraint, what it is costing the business, whether it is worth addressing, and what practical options exist.",
          "Discovery does not guarantee that a new system, software product or implementation will be recommended.",
        ],
        outcomes: [
          "the current process is acceptable",
          "improvement is not economically justified",
          "something small should change",
          "an existing capability should be used differently",
          "a commercial product is appropriate",
          "a custom solution is appropriate",
          "or no further work is justified",
        ],
      },
      {
        title: "Measure it",
        paragraphs: [
          "Understand the time, effort, cost and business impact involved so we can determine whether addressing the challenge makes commercial sense.",
        ],
      },
      {
        title: "Find a better way",
        paragraphs: [
          "There is no predetermined answer.",
          "The answer depends on the challenge. It may mean changing a workflow, connecting existing systems, improving reporting, retaining and improving an existing system, building something new, replacing something that no longer serves the business, automation, training, staffing changes, a specialist implementation partner, or something much simpler.",
        ],
      },
      {
        title: "Put it to work",
        paragraphs: [
          "Design, implement, test and establish the solution in the real business environment.",
        ],
      },
    ] as const satisfies readonly ProcessStage[],
  },
  corePrinciple: {
    lineOne: "The tool isn't the product.",
    lineTwo: "The better outcome is.",
    body: "WideOrder Resolve does not have a product to sell. It begins with a challenge to understand and solve.",
  },
  insitu: {
    statement: "We find it inSITU.",
    paragraphs: [
      "A play on in situ - working with something where it already exists, in its real environment. Better does not always mean replacing what you already have. Often, the right answer is already somewhere inside the business - in the systems, tools, knowledge and processes that are already working.",
      "We understand what is there, identify what is getting in the way, and decide what to keep, change, replace or build - without unnecessarily reinventing the wheel, and without preserving something that should be replaced.",
    ],
    principles: [
      { title: "Simple", body: "Make the work simpler, not more complicated." },
      {
        title: "Integrated",
        body: "Work intelligently with existing systems, information, infrastructure and processes where that makes sense.",
      },
      {
        title: "Trusted",
        body: "People need confidence in the outcome and need to understand that it works consistently.",
      },
      {
        title: "Used",
        body: "A technically excellent solution has no value if the people it was designed for do not actually use it.",
      },
    ] as const satisfies readonly PrincipleCard[],
    callout: "Simple and Used are non-negotiable.",
    calloutBody:
      "If the solution is too complicated to use, or people do not adopt it, it has failed regardless of how technically sophisticated it may be.",
  },
  existingEnvironment: {
    statement: "We start by understanding what is already in place.",
    paragraphs: [
      "A business may already have many of the right systems, tools, processes and knowledge. They may simply not be working together - or working the way the business needs them to.",
      "We start by understanding what is already in place, what works, what doesn't, and what is getting in the way.",
    ],
    assess: "Understand what is already there.",
    decisions: [
      "Keep what makes sense.",
      "Change what needs changing.",
      "Replace what needs replacing.",
      "Build what is missing.",
    ],
    conclusionOne: "The objective is neither preservation nor replacement.",
    conclusionTwo: "The objective is the better outcome.",
  },
  proof: {
    statement: "The proof is in the outcome.",
    introduction:
      "Four very different operational challenges. One consistent way of thinking. These are not products - they are proof that the same philosophy resolves very different challenges.",
    stories: [
      {
        title: "Retail Pricing",
        challenge:
          "A large South African hardware retailer effectively required a full-time employee to manage complex pricing across its inventory. Different products, margins, customer categories and commercial rules created significant complexity and opportunities for error.",
        betterWay:
          "A dynamic pricing solution was developed inside the company's existing ERP environment rather than replacing the ERP. Business rules, margin protection, customer-specific pricing, exceptions, validation and variance reporting were incorporated into the process.",
        result: "~20 minutes",
        interpretation:
          "A pricing process that had effectively consumed a full-time role could be completed across the business in approximately 20 minutes, with greater consistency, control and margin protection.",
      },
      {
        title: "Technology Deployment",
        challenge:
          "A global consumer-goods company experienced long-running help-desk tickets because preparing replacement computers was slow, inconsistent and technician-intensive. The backlog also affected the team's ability to demonstrate service efficiency to international management.",
        betterWay:
          "Using infrastructure and equipment already available to the business, a standardized deployment environment was created that could prepare up to 16 machines simultaneously.",
        result: "up to 16 machines simultaneously",
        interpretation:
          "Technician involvement was dramatically reduced, deployment became more consistent, machines could be prepared in a fraction of the previous time, and the help desk could focus its resources on other challenges.",
      },
      {
        title: "Remote Infrastructure & Printing",
        challenge:
          "The previous remote working environment was vulnerable to connectivity interruptions. When connectivity was interrupted, users could experience up to approximately 30 minutes of downtime before they could return to productive work.",
        betterWay:
          "The solution did not require throwing everything away and starting again. Existing technologies and infrastructure were combined and configured differently to create a more resilient remote working environment while also solving the associated printing requirements.",
        result: "~30 minutes -> 0 downtime",
        interpretation: "The technology already existed. The better outcome came from using it differently.",
      },
      {
        title: "Month-End Reporting",
        challenge:
          "The existing month-end process required significant skilled human effort because of the volume and repetitive preparation involved. The previous process could require approximately two additional skilled people for two and a half to three days each month.",
        betterWay:
          "A purpose-built solution now performs the repetitive preparation and processing, reducing the human involvement to approximately 10 minutes.",
        result: "~1,200 minutes -> ~10 minutes",
        interpretation:
          "Skilled people no longer need to spend days performing repetitive work that can be handled more effectively another way.",
      },
    ] as const satisfies readonly ProofStory[],
  },
  engagement: {
    statement: "After Discovery, two engagement models.",
    introduction:
      "If Discovery identifies a worthwhile way forward, the work can be taken on in either of two ways. Both are completely legitimate outcomes - neither is the better commercial choice.",
    models: [
      {
        title: "Project Engagement",
        body: "A defined solution is designed, implemented, tested and delivered within an agreed scope. Once the engagement is complete, the customer has the solution. Additional work can be undertaken later if required.",
      },
      {
        title: "Continuous Improvement",
        body: "The solution is still properly designed and implemented. The difference is that WideOrder Resolve remains engaged where an ongoing relationship can continue creating genuine value as the business changes and the effect of the solution becomes visible.",
      },
    ],
    supportLead: "This is not primarily technical support or maintenance.",
    supportHeading: "Sometimes you can't see the next constraint until the current one is removed.",
    supportBody:
      "A team may have spent so long working around one challenge that it has never had the capacity or visibility to see what lies beyond it. Once that constraint is removed, the business begins operating differently - and something previously hidden may become visible. That is not a failure of the original solution, and it is not WideOrder looking for another engagement to sell. It means removing one constraint can create enough clarity to see an opportunity that could not reasonably be seen before.",
    supportConclusion:
      "The objective is not to force every customer into an ongoing agreement. The objective is to structure the engagement in the way that makes the most sense for the customer, the challenge and the value being created.",
  },
  contact: {
    statement: "Tell us about the task, process or workaround that's taking longer than it should.",
    body: "We'll start there.",
    fields: [
      { label: "Name *", name: "name", type: "text", autoComplete: "name", required: true },
      {
        label: "Company (optional)",
        name: "company",
        type: "text",
        autoComplete: "organization",
      },
      { label: "Email *", name: "email", type: "email", autoComplete: "email", required: true },
      { label: "Phone (optional)", name: "phone", type: "tel", autoComplete: "tel" },
    ] as const satisfies readonly ContactField[],
    messageLabel: "What's taking your time? *",
    helperText: "A short description is completely fine.",
    exampleText: "e.g. Someone rebuilds the same pricing report by hand every week.",
    privacyText: "We use the details you submit to respond to your message.",
    submitLabel: "Tell us what's taking your time",
  },
  footer: {
    identity: ["WideOrder", "There is a better way.", "A GreenLangton company"],
    philosophy: "The tool isn't the product. The better outcome is.",
    navItems: [
      { label: "The Challenge", href: "#the-challenge" },
      { label: "How We Work", href: "#how-we-work" },
      { label: "Philosophy", href: "#philosophy" },
      { label: "Proof", href: "#proof" },
      { label: "Engagement", href: "#engagement" },
      { label: "Tell us what's taking your time", href: "#contact" },
    ] as const satisfies readonly NavItem[],
  },
} as const;
