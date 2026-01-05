
import { ProjectExample, TeamMember, BudgetItem } from './types';

export const PROJECTS: ProjectExample[] = [
  {
    title: "Vertical Garden Automation",
    description: "Students design and construct a vertical garden with automated watering systems and interactive data dashboards, fostering ecological stewardship.",
    curriculum: ["Technology", "Mathematics", "Science"],
    skills: ["Design thinking", "Automation", "Sustainability"],
    // UPDATED:
    image: "/images/p3.jpg"
  },
  {
    title: "Kapa Haka Neopixel Costumes",
    description: "Blending traditional Māori performance with modern tech, students create costumes with coded LED light shows, honoring cultural identity through innovation.",
    curriculum: ["Technology", "Arts", "Te Reo Māori"],
    skills: ["Electrical engineering", "Coding", "Cultural integrity"],
    // UPDATED:
    image: "/images/p4.jpeg"
  },
  {
    title: "Pacific Instruments Re-imagined",
    description: "Researching and building traditional instruments using modern acoustic engineering, empowering Pasifika youth through sound.",
    curriculum: ["Technology", "Arts", "Social Sciences"],
    skills: ["Acoustical engineering", "Craftsmanship", "Heritage"],
    // UPDATED:
    image: "/images/p2.jpg"
  },
  {
    title: "Motion Capture Sports Analysis",
    description: "Using high-end tech to analyze biomechanics in local sports clubs, bridging the gap between physical education and high-tech careers.",
    curriculum: ["Technology", "PE", "Mathematics"],
    skills: ["Biomechanical engineering", "Sports science", "Analytics"],
    // UPDATED:
    image: "/images/p1.jpg"
  }
];

export const TEAM: TeamMember[] = [
  {
    name: "Clark Williams",
    role: "Founder & Project Lead",
    bio: "Visionary educator with 10 years in STEAM, focused on disrupting educational inequity through mobile innovation.",
    // UPDATED:
    image: "/images/Clark.png"
  },
  {
    name: "Irihāpeti Mahuika",
    role: "Governance Advisor",
    bio: "Advocate for Kaupapa Māori and equity, ensuring our projects remain grounded in local community needs.",
    // UPDATED:
    image: "/images/irihapeti-mahuika.jpg"
  },
  {
    name: "Pania Watson",
    role: "Education Specialist",
    bio: "Leadership expert dedicated to empowering youth through hands-on, curriculum-aligned project work.",
    // UPDATED:
    image: "/images/pania.png"
  },
  {
    name: "Lex Davis",
    role: "Strategic Operations",
    bio: "Senior educator specializing in complex project management and scaling social impact across Aotearoa.",
    // UPDATED:
    image: "/images/lex.jpeg"
  }
];

export const BUDGET_DATA: BudgetItem[] = [
  { category: "Infrastructure", item: "Custom Mobile Lab Trailer", year1: 450000, annual: 15000 },
  { category: "Equipment", item: "STEAM & Engineering Gear", year1: 300000, annual: 25000 },
  { category: "Salaries", item: "Specialist Educators", year1: 350000, annual: 350000 },
  { category: "Operations", item: "Logistics & Maintenance", year1: 60000, annual: 45000 }
];

export const SYSTEM_INSTRUCTION = `
You are the Inertia Education Assistant. Your goal is to help potential partners and donors understand the social impact and vision of the project.
Key Details:
- Name: Inertia Education.
- Mission: A mobile innovation hub (high-tech white trailer) that brings high-end STEAM education to underserved communities.
- Focus: Social change, equity, and closing the digital divide in Aotearoa.
- Projects include: Mobile Lab, Kapa Haka Neopixels, Automated Botany, and Biomechanical Analytics.
- Method: Year-long residencies.
- Partnership: Partnered with The Kind Foundation.
Prioritize social change, student empowerment, and cultural connection. Use Te Reo Māori greetings like 'Kia ora' or 'Tēnā koe'.
`;
