
import { ProjectExample, TeamMember, BudgetItem } from './types';

export const PROJECTS: ProjectExample[] = [
  {
    title: "Mobile Innovation Hub",
    description: "Our custom 62m² DAF expandable trailer serves as a high-fidelity engineering lab that brings professional-grade STEAM equipment directly to school communities.",
    curriculum: ["Engineering", "Design", "Physics"],
    skills: ["Systems Thinking", "Project Management", "Technical Literacy"],
    image: "https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?q=80&w=800&auto=format&fit=crop" 
  },
  {
    title: "Kapa Haka Neopixels",
    description: "Students weave Te Ao Māori with modern electronics, coding wearable LED costumes that react to the rhythm and movement of traditional performance.",
    curriculum: ["Te Reo Māori", "Coding", "The Arts"],
    skills: ["Circuitry", "Logic", "Cultural Synthesis"],
    image: "https://images.unsplash.com/photo-1533035353720-f1c6a75cd8ab?q=80&w=800&auto=format&fit=crop"
  },
  {
    title: "Automated Botany",
    description: "Leveraging IoT and full-spectrum LED arrays, students build and monitor automated vertical gardens to solve food security challenges in urban spaces.",
    curriculum: ["Biology", "Automation", "Sustainability"],
    skills: ["Sensor Integration", "Data Analysis", "Ecological Stewardship"],
    image: "https://images.unsplash.com/photo-1558444479-c8a027920927?q=80&w=800&auto=format&fit=crop"
  },
  {
    title: "Biomechanical Analytics",
    description: "Using high-speed motion capture to bridge the gap between PE and Physics. Students analyze local athletes to calculate force, velocity, and optimized form.",
    curriculum: ["Physics", "PE", "Mathematics"],
    skills: ["Kinematics", "Biometrics", "Analytics"],
    image: "https://images.unsplash.com/photo-1517649763962-0c623066013b?q=80&w=800&auto=format&fit=crop"
  }
];

export const TEAM: TeamMember[] = [
  {
    name: "Clark Williams",
    role: "Founder & Project Lead",
    bio: "Visionary educator with 10 years in STEAM, focused on disrupting educational inequity through mobile innovation and community-led design.",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=400&auto=format&fit=crop"
  },
  {
    name: "Pania Watson",
    role: "Education Specialist",
    bio: "Leadership expert dedicated to empowering youth through hands-on, curriculum-aligned project work and deep community engagement.",
    image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=400&auto=format&fit=crop"
  },
  {
    name: "Irihāpeti Mahuika",
    role: "Governance Advisor",
    bio: "Advocate for Kaupapa Māori and equity, ensuring our projects remain grounded in local community needs and cultural integrity.",
    image: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=400&auto=format&fit=crop"
  },
  {
    name: "Lex Davis",
    role: "Strategic Operations",
    bio: "Senior educator specializing in complex project management and scaling social impact across Aotearoa's educational landscape.",
    image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=400&auto=format&fit=crop"
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
