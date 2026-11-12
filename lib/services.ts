import { serviceNames, type Interest, type Mode } from "./site-config";

export type ServicePageData = {
  mode: Mode;
  category: string;
  promise: [string, string];
  intro: string;
  audience: string;
  interest: Interest;
  cta: string;
  asideTitle: string;
  asideLabel: string;
  aside: [string, string][];
  offersTitle: string;
  offersIntro: string;
  offers: [string, string][];
  noteTitle: string;
  note: string;
  processTitle: string;
  process: [string, string][];
  faqs: { question: string; answer: string }[];
  finalTitle: string;
  finalDescription: string;
};

export const servicePages: Record<string, ServicePageData> = {
  ai: {
    mode: "AI",
    category: "AI DEVELOPMENT & AUTOMATION",
    promise: ["Put your information", "to work."],
    intro:
      "An assistant that finds the right answer. A report that stops eating into your week. A workflow that connects the tools you already use. Start with one useful problem and a scoped pilot.",
    audience: "For businesses and small teams",
    interest: "ai",
    cta: "Discuss an AI project",
    asideTitle: "A useful pilot starts here.",
    asideLabel: "ILLUSTRATIVE PILOT BRIEF",
    aside: [
      ["The problem", "A recurring report built by copying spreadsheets."],
      [
        "The deliverable",
        "A repeatable report and an assistant to explain it.",
      ],
      ["The evidence", "Answers linked to the underlying information."],
      ["The agreement", "Acceptance criteria, schedule and support window."],
    ],
    offersTitle: "Build around the work.",
    offersIntro:
      "Choose the task first. The right combination of AI, data integration and automation follows from that.",
    offers: [
      [
        "Find answers in your own information",
        "Internal knowledge and data assistants that retrieve relevant material and include source references, so your team can check the answer.",
      ],
      [
        "Take repeat work out of the workflow",
        "Connect inputs, tools and agreed actions: move information between systems, prepare documents, or automate a recurring hand-off.",
      ],
      [
        "Make recurring reporting repeatable",
        "Bring spreadsheet or system data together, apply agreed checks and prepare reports with a clear route back to the inputs.",
      ],
      [
        "Build an application around the task",
        "AI-enabled applications and tool-using agents, with the data integrations, review points and permitted actions agreed in the scope.",
      ],
    ],
    noteTitle: "A pilot you can evaluate.",
    note: "Before work starts, agree the problem, deliverables, data access, acceptance criteria, schedule and support window. Review the result against that scope. Further work and ongoing support are agreed separately.",
    processTitle: "From a recurring task to a scoped pilot.",
    process: [
      [
        "Describe the task",
        "Who does the work, what information is involved and what makes it difficult? Start with a description rather than confidential files.",
      ],
      [
        "Define useful",
        "Agree what the pilot should produce, how it will be checked and which actions need human review.",
      ],
      [
        "Build and review",
        "Review the delivered work against the acceptance criteria, then decide the next step and any additional support.",
      ],
    ],
    faqs: [
      {
        question: "Do I need a finished specification?",
        answer:
          "No. A clear description of the task, current tools and desired result is enough for an initial enquiry. The pilot scope, deliverables and review criteria are agreed before work starts.",
      },
      {
        question: "Can an assistant use our existing information?",
        answer:
          "That is part of the scoping discussion. We review where the information lives, how access can be provided and which sources should support an answer. Integrations and permitted actions are agreed for each project.",
      },
      {
        question: "What happens after the pilot?",
        answer:
          "Review the result against the agreed criteria. A wider rollout, additional features or ongoing support would have their own scope and terms. The pilot includes only the support window agreed at the start.",
      },
    ],
    finalTitle: "Bring the task. Let’s shape the pilot.",
    finalDescription:
      "Tell us what takes time today, where the information lives and what a useful result would look like.",
  },
  career: {
    mode: "Career",
    category: "LIVE LEARNING & CAREER DEVELOPMENT",
    promise: ["Learn by building.", "Progress with feedback."],
    intro:
      "Register interest in future live weekend workshops and cohorts for data and AI professionals. Start with practical work, ask questions as you go and get feedback on what you build.",
    audience: "Remote learning for a UK and Europe audience",
    interest: "learning",
    cta: "Register learning interest",
    asideTitle: "A practical learning rhythm.",
    asideLabel: "PLANNED LEARNING APPROACH",
    aside: [
      ["Learn", "Live weekend sessions and time for questions."],
      ["Build", "Practical assignments and projects."],
      ["Review", "Doubt-clearing and feedback on your work."],
      ["Prepare", "A roadmap and support for your next application."],
    ],
    offersTitle: "Work you can talk through.",
    offersIntro:
      "Initial teaching is grounded in the founder’s data engineering experience. Data science and applied AI are also subject interests you can register.",
    offers: [
      [
        "Live weekend learning",
        "Future remote sessions planned around a UK and Europe audience, with live doubt-clearing and the format and session times confirmed before registration.",
      ],
      [
        "Practical assignments and reviewed projects",
        "Build something, explain your choices and get feedback on the work. Use that feedback to identify what to practise next.",
      ],
      [
        "A career roadmap for your starting point",
        "Discuss your current skills, the area you want to move towards and the learning or project work that could form your next steps.",
      ],
      [
        "Support for the application process",
        "CV and LinkedIn feedback, mock interviews and application guidance. Hiring employers make employment decisions; support focuses on the preparation you can do.",
      ],
    ],
    noteTitle: "Register interest. Hear about a suitable format.",
    note: "Share your subject, starting point and preferred availability to register interest in future workshops and cohorts. The schedule, format, scope and any fees will be shared when a suitable option is ready, before you decide whether to join.",
    processTitle: "Start where you are.",
    process: [
      [
        "Share your starting point",
        "Tell us whether you are exploring data engineering, data science or applied AI, and what you have worked with so far.",
      ],
      [
        "Find a suitable next step",
        "Discuss the planned learning format or the specific career preparation you need. Confirm scope and availability before committing.",
      ],
      [
        "Build, review and practise",
        "Work through agreed assignments or preparation, use the feedback and review the next step on your roadmap.",
      ],
    ],
    faqs: [
      {
        question: "Which subjects are the initial focus?",
        answer:
          "Initial teaching focuses on data engineering, drawing on Python, SQL, Spark, Databricks, Azure and production data pipeline experience. You can also register interest in data science and applied AI; this does not mean a cohort in each area is currently available.",
      },
      {
        question: "Is this suitable alongside work?",
        answer:
          "The planned live learning format is based around weekends and remote delivery for a UK and Europe audience. Exact dates, session times and expected assignment work will be confirmed before registration.",
      },
      {
        question: "Does career support include introductions or a job?",
        answer:
          "Career support covers roadmaps, CV and LinkedIn feedback, mock interviews and application guidance. Employment decisions belong to hiring employers. Developer introductions are a separate interest route through BuildMyTeam, when a suitable opportunity and relationship exist.",
      },
    ],
    finalTitle: "What would you like to learn next?",
    finalDescription:
      "Share your subject interest, starting point and the support you would find useful.",
  },
  team: {
    mode: "Team",
    category: "DEVELOPER SOURCING & ENGAGEMENT",
    promise: ["Define the role.", "Find a considered fit."],
    intro:
      "Developer sourcing for businesses that know what they need to build, and want help finding the people to build it. Start with the work, then agree the role, assessment and engagement requirements.",
    audience: "For businesses seeking developers",
    interest: "hiring",
    cta: "Discuss developer needs",
    asideTitle: "The role comes before the search.",
    asideLabel: "A CLEAR DEVELOPER BRIEF",
    aside: [
      ["The work", "Responsibilities and what the developer will build."],
      ["The skills", "Technical requirements and relevant experience."],
      ["The fit", "Assessment, time-zone overlap and ways of working."],
      ["The engagement", "Introductions, coordination and agreed terms."],
    ],
    offersTitle: "From requirements to an introduction.",
    offersIntro:
      "A technical brief creates a better starting point for sourcing, assessment and a useful conversation with a developer.",
    offers: [
      [
        "Define the role",
        "Clarify responsibilities, technical skills, experience, location or time zone, and how the developer will work with your existing team.",
      ],
      [
        "Source relevant developers",
        "Look for developers against the agreed requirements, with the type of engagement and availability discussed as part of the enquiry.",
      ],
      [
        "Assess technical fit",
        "Shape technical assessment around the role, then review relevant skills and project experience before coordinating an introduction.",
      ],
      [
        "Coordinate the engagement",
        "Support introductions and engagement details, with responsibilities, commercial terms and next steps agreed before work begins.",
      ],
    ],
    noteTitle: "Clear terms before an engagement.",
    note: "For developer supply, your business would engage and pay BuildMyX on agreed terms. Responsibilities, working arrangements and developer availability are discussed for each requirement, with the terms agreed before an engagement begins.",
    processTitle: "Begin with a clear developer brief.",
    process: [
      [
        "Describe the requirement",
        "Share the work, essential skills, likely engagement and the working arrangement your team needs.",
      ],
      [
        "Agree sourcing and assessment",
        "Define what relevant experience looks like and how technical fit will be reviewed. Discuss commercial terms and expectations.",
      ],
      [
        "Meet and decide",
        "Review suitable developers, coordinate introductions and agree any engagement details before work starts.",
      ],
    ],
    faqs: [
      {
        question: "What should an employer include in an enquiry?",
        answer:
          "A short description of the project, the role, essential technical skills, preferred time zone or location, and the likely engagement. Relevant company or project links are optional. Detailed requirements can follow after the initial discussion.",
      },
      {
        question: "Are developers available to start immediately?",
        answer:
          "Availability is established for a particular requirement. No immediately available developers or confirmed start dates are advertised here. Share your needs so sourcing and engagement options can be discussed.",
      },
      {
        question: "Can a developer register interest directly?",
        answer:
          "Yes. The separate developer route lets you share your skills, experience and interests. Referrals are introductions when a suitable opportunity and relationship exist. Registering does not confirm an open role or an introduction.",
      },
    ],
    finalTitle: "Who does your team need?",
    finalDescription:
      "Start with the role, the work and the technical requirements. We can work through the rest of the brief together.",
  },
};

export function servicePageTitle(service: ServicePageData) {
  return {
    AI: "Reporting automation & AI development | BuildMyAI",
    Career: "Practical data learning & career support | BuildMyCareer",
    Team: "Developer sourcing & technical screening | BuildMyTeam",
  }[service.mode];
}
