// Content for the public Inertia Education site.
// The homepage (/) covers the organisation as a whole; the Maker Truck
// programme has its own page (/maker-truck). Edit copy, programmes, projects,
// team and budget figures here.

// ---------------------------------------------------------------------------
// SECTION SWITCHES
// ---------------------------------------------------------------------------
// Board of Trustees ("Built by Experience" / Team section).
// Set to `false` to hide the section and its "Team" menu links.
// Nothing is deleted: the people below stay in this file, so set it back to
// `true` whenever you want the section to reappear.
export const SHOW_TRUSTEES = true;

// Contact + social links used across the site.
export const CONTACT_EMAIL = 'clark@inertiaed.org';
// Paste the full LinkedIn page URL here (e.g. 'https://www.linkedin.com/company/...').
// While it is empty, the LinkedIn button in the footer is hidden.
export const LINKEDIN_URL = '';

export interface ProjectExample {
  title: string;
  description: string;
  curriculum: string[];
  skills: string[];
  image: string;
}

export interface TeamMember {
  name: string;
  role: string;
  bio: string;
  image: string;
}

export interface BudgetItem {
  title: string;
  amount: number;
  description: string;
}

export interface NavLink {
  name: string;
  href: string;
}

// Menu on the homepage (the organisation as a whole).
const ALL_HOME_NAV_LINKS: NavLink[] = [
  { name: 'Mission', href: '#mission' },
  { name: 'Programmes', href: '#programmes' },
  { name: 'Team', href: '#team' },
  { name: 'Get Involved', href: '#get-involved' },
];

// The "Team" link is dropped automatically when the trustees section is hidden.
export const HOME_NAV_LINKS = ALL_HOME_NAV_LINKS.filter(link => SHOW_TRUSTEES || link.href !== '#team');

// Menu on the Maker Truck page (/maker-truck).
export const MAKER_TRUCK_NAV_LINKS: NavLink[] = [
  { name: 'Overview', href: '#vision' },
  { name: 'Impact', href: '#impact' },
  { name: 'Projects', href: '#projects' },
  { name: 'Budget', href: '#budget' },
];

// ---------------------------------------------------------------------------
// HOMEPAGE: the organisation's wider mission
// ---------------------------------------------------------------------------
export interface Pillar {
  title: string;
  description: string;
}

// What Inertia Education stands for, across every programme.
export const PILLARS: Pillar[] = [
  {
    title: 'Opportunity, not postcode',
    description:
      "Talent is everywhere, but opportunity is often stationary. We take tools, expertise and experiences to the communities that have had the least access to them.",
  },
  {
    title: 'Grounded in culture',
    description:
      "Innovation is in the DNA of Aotearoa. Our work weaves te ao Māori, Pasifika knowledge and local pūrakau together with modern making, so learning reflects who young people are.",
  },
  {
    title: 'Capability that stays',
    description:
      "We don't just visit and leave. We upskill teachers, whānau and community leaders so skills and resources keep growing long after a programme moves on.",
  },
  {
    title: 'Led by community',
    description:
      'Every project starts with the people it serves. Schools and communities shape what we build together, so the work answers real local needs.',
  },
];

export interface Programme {
  title: string;
  status: string;
  description: string;
  image: string;
  href: string;
  linkLabel: string;
}

// Programmes run by Inertia Education. Add a new entry here for each new
// initiative and it appears on the homepage automatically.
export const PROGRAMMES: Programme[] = [
  {
    title: 'The Maker Truck',
    status: 'Flagship programme',
    description:
      "A 62m² expandable mobile makerspace that spends a full year at a host school, bringing professional engineering, digital fabrication and design tools straight to the school gates.",
    image: '/images/outsideview.jpg',
    href: '/maker-truck',
    linkLabel: 'Explore the Maker Truck',
  },
];

export const PROJECTS: ProjectExample[] = [
  {
    title: "Vertical Garden Automation",
    description: "Students design and construct a vertical garden with automated watering systems and interactive data dashboards, fostering ecological stewardship.",
    curriculum: ["Technology", "Mathematics", "Science"],
    skills: ["Design thinking", "Automation", "Sustainability"],
    image: "/images/p3.jpg"
  },
  {
    title: "Kapa Haka Neopixel Costumes",
    description: "Blending traditional Māori performance with modern tech, students create costumes with coded LED light shows, honoring cultural identity through innovation.",
    curriculum: ["Technology", "Arts", "Te Reo Māori"],
    skills: ["Electrical engineering", "Coding", "Cultural integrity"],
    image: "/images/p4.jpeg"
  },
  {
    title: "Pacific Instruments Re-imagined",
    description: "Researching and building traditional instruments using modern acoustic engineering, empowering Pasifika youth through sound.",
    curriculum: ["Technology", "Arts", "Social Sciences"],
    skills: ["Acoustical engineering", "Craftsmanship", "Heritage"],
    image: "/images/p2.jpg"
  },
  {
    title: "Motion Capture Sports Analysis",
    description: "Using high-end tech to analyze biomechanics in local sports clubs, bridging the gap between physical education and high-tech careers.",
    curriculum: ["Technology", "PE", "Mathematics"],
    skills: ["Biomechanical engineering", "Sports science", "Analytics"],
    image: "/images/p1.jpg"
  }
];

export const TEAM: TeamMember[] = [
  {
    name: "Clark Williams",
    role: "Founder & Project Lead",
    bio: "Visionary educator with 10 years in STEAM, focused on disrupting educational inequity through mobile innovation and community-led design.",
    image: "/images/Clark.png"
  },
  {
    name: "Irihāpeti Mahuika",
    role: "Governance Advisor",
    bio: "Advocate for Kaupapa Māori and equity, ensuring our projects remain grounded in local community needs and cultural integrity.",
    image: "/images/irihapeti-mahuika.jpg"
  },
  {
    name: "Pania Watson",
    role: "Education Specialist",
    bio: "Leadership expert dedicated to empowering youth through hands-on, curriculum-aligned project work and deep community engagement.",
    image: "/images/pania.png"
  },
  {
    name: "Lex Davis",
    role: "Strategic Operations",
    bio: "Senior educator specializing in complex project management and scaling social impact across Aotearoa's educational landscape.",
    image: "/images/lex.jpeg"
  }
];

// Establishment budget shown in the Budget section. The total is worked out
// from these figures, so it always adds up.
export const BUDGET_ITEMS: BudgetItem[] = [
  {
    title: "Mobile Infrastructure & Fit-Out",
    amount: 750000,
    description: "62m² expandable Makerspace Trailer from the Netherlands, complete custom internal building, and foundational cultural implementation.",
  },
  {
    title: "High-End Tech & Equipment",
    amount: 350000,
    description: "CAD/CAM, 3D printers, CNC, computing arrays, digital media gear, and a secure allocation for a decade of technology upgrades and expendables.",
  },
  {
    title: "Decade-Long Operations",
    amount: 200000,
    description: "A dedicated 10-year runway covering comprehensive insurance, safety compliance, software licenses, and administrative overhead.",
  },
];
