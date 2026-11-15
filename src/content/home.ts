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

export type DeliveryMode = {
  title: string;
  body: string;
};

export type EngagementModel = {
  title: string;
  body: string;
};

export type ProofStory = {
  id: string;
  title: string;
  summary: string;
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

export const siteContent = {
  shared: {
    navItems: [
      { label: "What We Do", href: "/what-we-do" },
      { label: "How We Work", href: "/how-we-work" },
      { label: "Our Work", href: "/our-work" },
      { label: "Our Approach", href: "/our-approach" },
      { label: "Contact", href: "/contact" },
    ] as const satisfies readonly NavItem[],
    primaryCta: {
      label: "Let's talk",
      href: "/contact",
    },
    footer: {
      identity: ["WideOrder", "There is a better way.", "A GreenLangton company"],
      philosophy: "The tool isn't the product. The better outcome is.",
      navItems: [
        { label: "What We Do", href: "/what-we-do" },
        { label: "How We Work", href: "/how-we-work" },
        { label: "Our Work", href: "/our-work" },
        { label: "Our Approach", href: "/our-approach" },
        { label: "Contact", href: "/contact" },
      ] as const satisfies readonly NavItem[],
    },
  },
  home: {
    hero: {
      serviceName: "WideOrder Resolve",
      brandPromise: "There is a better way.",
      headline: "Your business shouldn't have to work this hard.",
      statement: "WideOrder solves operational problems that don't fit neatly into one department, system or supplier.",
      supportingCopy:
        "We connect the dots between people, processes and technology to identify what's getting in the way and help deliver a practical solution.",
      secondaryCopy:
        "Sometimes the problem is clear. Sometimes it is only clear that something is not working as it should. WideOrder investigates, works out a sensible path, and helps get the right work done.",
      primaryCtaLabel: "Discuss a Challenge",
      examples: [
        "A report that takes hours",
        "A stalled implementation",
        "Data entered twice",
        "A recurring workaround",
        "A process that keeps failing",
        "Only one person knows how",
        "Systems that almost connect",
        "A job nobody has fixed properly",
      ],
      secondaryCta: {
        label: "Explore Our Work",
        href: "/our-work",
      },
    },
    overview: {
      statement: "Practical problem-solving, not a narrow service category.",
      cards: [
        {
          title: "Investigate the problem",
          body: "WideOrder starts by understanding what is actually happening, what is creating the constraint, and whether solving it will create meaningful value.",
        },
        {
          title: "Work out the right path",
          body: "The answer is not predetermined. It may involve process change, better use of an existing capability, direct execution, specialist coordination, or an ongoing service.",
        },
        {
          title: "Get the work delivered",
          body: "WideOrder does more than recommend. It can execute directly, manage implementation, coordinate specialists, and remain involved where recurring work needs ongoing ownership.",
        },
      ],
    },
    positioning: {
      lineOne: "No predetermined answer.",
      lineTwo: "Start with the problem.",
      body: "WideOrder is not defined by consulting, software, automation, outsourcing or staffing alone. Those may form part of a solution, but none individually defines the business.",
    },
    workPreview: {
      statement: "Examples of real business problems solved.",
      introduction:
        "WideOrder works across very different operational challenges, but the underlying approach stays the same: understand the situation, identify what will genuinely help, and deliver the better outcome.",
    },
    detailLinks: [
      {
        label: "What We Do",
        href: "/what-we-do",
        body: "See the kinds of problems WideOrder addresses and the ways work can be delivered.",
      },
      {
        label: "How We Work",
        href: "/how-we-work",
        body: "Understand the paid Discovery model, the commercial lens, and the path from diagnosis to delivery.",
      },
      {
        label: "Our Work",
        href: "/our-work",
        body: "See four case studies covering the challenge, the better way, and the outcome.",
      },
      {
        label: "Our Approach",
        href: "/our-approach",
        body: "Explore inSITU, existing-environment assessment, and the principles behind WideOrder Resolve.",
      },
    ] as const,
  },
  whatWeDo: {
    pageLabel: "What We Do",
    title: "WideOrder helps businesses deal with work that needs fixing, improving, implementing, coordinating or managing.",
    paragraphs: [
      "Sometimes the problem is obvious. Sometimes the only clear fact is that something keeps consuming time, creating pain, or failing to work as it should.",
      "WideOrder investigates the situation, develops a sensible course of action, and helps ensure the right work gets done.",
    ],
    problemExamples: [
      "A recurring task that consumes skilled time every week.",
      "A process that depends on one person knowing how it works.",
      "An implementation or operational change that has stalled.",
      "A workaround that keeps reappearing because the real issue was never addressed.",
      "A system or process that almost works but still leaves costly gaps.",
      "A recurring burden the business needs handled properly on an ongoing basis.",
    ],
    deliveryStatement:
      "Depending on the engagement, WideOrder can investigate the problem, develop practical options, execute work directly, coordinate specialists, manage delivery, or provide an ongoing service.",
    deliveryModes: [
      {
        title: "Direct execution",
        body: "Where WideOrder has the required capability, it performs the work.",
      },
      {
        title: "Managed implementation",
        body: "Where specialist expertise is necessary, WideOrder helps define, coordinate and manage the solution.",
      },
      {
        title: "Ongoing service",
        body: "Where the need is recurring, WideOrder can remain responsible for agreed operational work.",
      },
    ] as const satisfies readonly DeliveryMode[],
    positioning: {
      statement: "WideOrder is broader than a single service category.",
      body: "Business problems do not necessarily follow departmental or supplier boundaries. WideOrder brings specialist expertise and broader operational understanding together.",
    },
    boundaryTitle: "Specialist boundaries remain clear.",
    boundaryBody:
      "Regulated work requires appropriately qualified and authorized specialists. WideOrder can help identify and coordinate that expertise within an agreed scope.",
    valuePoints: [
      "Reduced operating costs",
      "Increased revenue or capacity",
      "Recovered employee or management time",
      "Fewer errors and less rework",
      "Improved reliability and continuity",
      "Reduced dependency on individual employees",
      "Reduced operational risk",
      "Successful delivery of otherwise stalled work",
      "Removal of ongoing burdens from the client",
    ],
  },
  howWeWork: {
    pageLabel: "How We Work",
    title: "A structured engagement from Discovery through delivery.",
    paragraphs: [
      "WideOrder Resolve preserves a paid Discovery model because understanding the challenge properly is part of the value being created.",
      "Discovery may legitimately conclude that no further engagement is justified. That is a valid professional outcome, not a failure of the process.",
    ],
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
          "Paid Discovery establishes what is happening, what creates the constraint, what it costs or disrupts, whether change makes commercial sense, and which practical options exist.",
          "It does not guarantee a solution or further implementation work. Recommending no further engagement is a valid professional judgment.",
        ],
        outcomes: [
          "Nothing needs changing.",
          "An internal adjustment is sufficient.",
          "An existing supplier should resolve the issue.",
          "A specialist is required.",
          "A broader implementation is justified.",
          "No further engagement is economically worthwhile.",
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
        paragraphs: ["Choose the practical option that fits the business, its constraints and the agreed outcome."],
      },
      {
        title: "Put it to work",
        paragraphs: [
          "Design, implement, test and establish the solution in the real business environment.",
        ],
      },
    ] as const satisfies readonly ProcessStage[],
    engagementStatement: "After Discovery, the engagement model should match the work.",
    engagementIntroduction:
      "If Discovery identifies a worthwhile way forward, the next step depends on the nature of the problem, the value being created, and whether the need is one-time, evolving, or inherently recurring.",
    engagementModels: [
      {
        title: "Project Engagement",
        body: "Deliver a defined solution within an agreed scope, from implementation through testing and handover.",
      },
      {
        title: "Continuous Improvement",
        body: "Continue improving an implemented solution as the business changes and further opportunities become clear.",
      },
      {
        title: "Ongoing Service Delivery",
        body: "Remain responsible for agreed recurring operational work, rather than a one-time implementation.",
      },
    ] as const satisfies readonly EngagementModel[],
    supportLead: "This is not primarily technical support or maintenance.",
    supportHeading: "Sometimes you can't see the next constraint until the current one is removed.",
    supportBody:
      "A team may have spent so long working around one challenge that it has never had the capacity or visibility to see what lies beyond it. Once that constraint is removed, the business begins operating differently - and something previously hidden may become visible. That is not a failure of the original solution, and it is not WideOrder looking for another engagement to sell. It means removing one constraint can create enough clarity to see an opportunity that could not reasonably be seen before.",
    supportConclusion:
      "Continuous Improvement and ongoing service delivery may overlap, but they are not identical by default. The objective is to structure the engagement in the way that makes the most sense for the customer, the challenge and the value being created.",
  },
  ourWork: {
    pageLabel: "Our Work",
    title: "Real-world problem-solving across very different operational challenges.",
    paragraphs: [
      "These are not products. They are examples of a consistent way of thinking applied to very different business problems.",
      "Each case study shows the challenge, the better way, and the outcome.",
    ],
    statement: "Start with the outcome, then explore the detail.",
    introduction:
      "Use these summaries to scan the outcomes quickly, then jump to the case study that is most relevant.",
    stories: [
      {
        id: "retail-pricing",
        title: "Retail Pricing",
        summary: "Retail pricing: an ongoing full-time burden reduced to approximately 20 minutes across the business, within the existing ERP.",
        challenge:
          "A hardware retailer effectively required a full-time employee to manage complex pricing across its inventory. Different products, margins, customer categories and commercial rules created significant complexity and opportunities for error.",
        betterWay:
          "A dynamic pricing solution was developed inside the company's existing ERP environment rather than replacing the ERP. Business rules, margin protection, customer-specific pricing, exceptions, validation and variance reporting were incorporated into the process.",
        result: "~20 minutes",
        interpretation:
          "A pricing process that had effectively consumed a full-time role could be completed across the business in approximately 20 minutes, with greater consistency, control and margin protection.",
      },
      {
        id: "technology-deployment",
        title: "Technology Deployment",
        summary: "Existing infrastructure enabled preparation of up to 16 machines simultaneously, reducing a computer-deployment backlog.",
        challenge:
          "A consumer-goods company experienced long-running help-desk tickets because preparing replacement computers was slow, inconsistent and technician-intensive. The backlog also affected the team's ability to demonstrate service efficiency to international management.",
        betterWay:
          "Using infrastructure and equipment already available to the business, a standardized deployment environment was created that could prepare up to 16 machines simultaneously.",
        result: "up to 16 machines simultaneously",
        interpretation:
          "Technician involvement was dramatically reduced, deployment became more consistent, machines could be prepared in a fraction of the previous time, and the help desk could focus its resources on other challenges.",
      },
      {
        id: "remote-infrastructure-printing",
        title: "Remote Infrastructure & Printing",
        summary: "Reconfigured remote infrastructure removed the previous connectivity-related downtime burden and supported printing.",
        challenge:
          "The previous remote working environment was vulnerable to connectivity interruptions. When connectivity was interrupted, users could experience up to approximately 30 minutes of downtime before they could return to productive work.",
        betterWay:
          "The solution did not require throwing everything away and starting again. Existing technologies and infrastructure were combined and configured differently to create a more resilient remote working environment while also solving the associated printing requirements.",
        result: "~30 minutes -> 0 downtime",
        interpretation: "The technology already existed. The better outcome came from using it differently.",
      },
      {
        id: "month-end-reporting",
        title: "Month-End Reporting",
        summary: "Month-end reporting: approximately 20 hours to approximately 10 minutes of active human preparation, recovering skilled capacity.",
        challenge:
          "Month-end preparation required approximately 20 hours of active work, equivalent to 2.5 standard eight-hour working days. Because this effort competed with everyday responsibilities, completion could extend across a longer calendar period.",
        betterWay:
          "A purpose-built solution performs repetitive preparation and processing. Active human preparation takes approximately 10 minutes; background computer processing is separate.",
        result: "~1,200 minutes -> ~10 minutes",
        interpretation:
          "The recovered capacity lets skilled staff focus on more valuable work. The comparison measures active preparation, not total elapsed processing time.",
      },
    ] as const satisfies readonly ProofStory[],
  },
  ourApproach: {
    pageLabel: "Our Approach",
    title: "inSITU starts with the real environment and works toward the better outcome.",
    paragraphs: [
      "WideOrder Resolve does not begin with a predetermined tool to sell. It begins with a challenge to understand and solve.",
      "The approach is practical, commercially grounded, and designed to work in the real business environment rather than in theory.",
    ],
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
        { title: "Integrated", body: "Connect existing systems and processes where practical." },
        { title: "Trusted", body: "Make outcomes understandable and dependable." },
        { title: "Used", body: "A solution has little value if people cannot or do not use it." },
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
    value: {
      statement: "Work should create credible value relative to its cost.",
      introduction:
        "WideOrder undertakes work where there is a credible expectation that the resulting benefit will meaningfully exceed the cost of the engagement. Not all value is purely financial, but the client should be materially better off because the work was done.",
      points: [
        "Reduced operating costs",
        "Increased revenue or capacity",
        "Recovered employee or management time",
        "Fewer errors and less rework",
        "Improved reliability and continuity",
        "Reduced dependency on individual employees",
        "Reduced operational risk",
        "Successful delivery of otherwise stalled work",
        "Removal of ongoing burdens from the client",
      ],
    },
  },
  contact: {
    pageLabel: "Contact",
    title: "Start with the problem.",
    paragraphs: [
      "Send a short description of what is taking too long, what keeps going wrong, what needs implementing, or what feels harder than it should.",
      "A few lines is enough to begin the conversation.",
    ],
    fields: [
      { label: "Name", name: "name", autoComplete: "name", required: true },
      { label: "Company", name: "company", autoComplete: "organization" },
      { label: "Email", name: "email", type: "email", autoComplete: "email", required: true },
      { label: "Phone", name: "phone", type: "tel", autoComplete: "tel" },
    ] as const satisfies readonly ContactField[],
    formTitle: "Send a short description of the challenge.",
    messageLabel: "Business challenge",
    helperText: "A few sentences are enough. Do not include credentials, confidential operational records or sensitive datasets.",
    exampleText: "What is taking too long, what keeps going wrong, or what should already be working?",
    privacyText: "Your submission is checked for abuse before delivery. We save it securely to handle your enquiry, including when its email notification is pending.",
    submitLabel: "Send enquiry",
    emailLabel: "Email",
    buttonLabel: "Compose an email",
    prompts: [
      "What is happening now?",
      "What keeps consuming time, attention or capacity?",
      "What should be easier, more reliable, or simply done already?",
    ],
  },
} as const;

// Approved v0.4.0006 editorial refinement.
export const positioning = {
  symptomTitle: "The problem isn't always where the symptoms appear.",
  symptomCopy: "Reporting trouble may begin with disconnected systems; stalled work with unclear responsibilities. WideOrder looks beyond the symptom to understand the wider operation.",
  insituTagline: "Understand it where it happens. Solve it where it matters.",
  insituIntro: "We understand the people, processes, systems and constraints already in place before deciding what should change.",
  insituCore: "inSITU is a founding principle of WideOrder: understand the people, systems, processes and constraints shaping a problem before deciding what should change.",
  dimensions: [
    { title: "Operational understanding", body: "Understand how people, systems and processes work together." },
    { title: "Commercial judgment", body: "Use existing resources. Replace or build when the outcome justifies it." },
    { title: "Information control", body: "Client information remains under client control by default. Work within client environments; minimize transfer, duplication and exposure. Exceptions require explicit authorization, safeguards and agreed engagement limits." },
  ],
  confidentiality: "Real engagements, with client identities and identifying operational details withheld. We share challenges, approaches and outcomes while protecting confidentiality.",
  personnel: "WideOrder limits unnecessary public exposure of operational personnel to reduce avoidable security risks. Clients receive the identity, authorization and accountability information appropriate to their engagement.",
  experience: "WideOrder draws on decades of practical experience across operations, technology, financial processes and implementation, helping recognize problems beyond a single discipline.",
} as const;
