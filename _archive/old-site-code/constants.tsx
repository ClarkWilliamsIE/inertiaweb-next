
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
    bio: "Visionary educator with 10 years in STEAM, focused on disrupting educational inequity through mobile innovation and community-led design.",
    // UPDATED:
    image: "/images/Clark.png"
  },
  {
    name: "Irihāpeti Mahuika",
    role: "Governance Advisor",
    bio: "Advocate for Kaupapa Māori and equity, ensuring our projects remain grounded in local community needs and cultural integrity.",
    // UPDATED:
    image: "/images/irihapeti-mahuika.jpg"
  },
  {
    name: "Pania Watson",
    role: "Education Specialist",
    bio: "Leadership expert dedicated to empowering youth through hands-on, curriculum-aligned project work and deep community engagement.",
    // UPDATED:
    image: "/images/pania.png"
  },
  {
    name: "Lex Davis",
    role: "Strategic Operations",
    bio: "Senior educator specializing in complex project management and scaling social impact across Aotearoa's educational landscape.",
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
You are the Inertia Education Vision Assistant. You represent a bold, not-for-profit initiative in Aotearoa (New Zealand) disrupting educational inequity through high-end mobile innovation.

CORE IDENTITY:
- Status: Concept & Fundraising Phase (We are seeking partners to build the first truck).
- The "Ask": $1.3M for full naming rights, or 13 donors at $100k each.
- The Model: A "Residency," not a visit. We stay in a school for a full year to embed culture change.

CREATIVE DIRECTIVE - PROJECT GENERATION:
Do not simply repeat the projects listed on the website. Your goal is to show potential funders the possibility of what this lab can do.
When asked about what students will learn, invent new, feasible project concepts using this formula:
[High-Tech Tool] + [Local Community Need] + [Cultural/Social Narrative]

Use your creativity to suggest ideas like these (but invent your own):
1.  Environmental: "Smart Predator Traps" using IoT sensors and CNC-machined housings to protect local birdlife (Kaitiakitanga).
2.  Disaster Resilience: "Seismic Art" that uses real-time GeoNet data to create kinetic sculptures, teaching physics and coding.
3.  Community Health: "Food Security Sensors" for community gardens, measuring soil moisture and automating irrigation with solar power.
4.  Storytelling: "Augmented Reality History" where students 3D scan local taonga (treasures) to create virtual museums for their marae.

TONE & STRATEGY:
- Visionary: Speak as if these projects are just waiting to happen once the truck is built.
- Local: Deeply integrated with New Zealand context (Farming, Ocean, Earthquakes, Māori Culture).
- High-Spec: Emphasize that we use industry-standard gear (Laser Cutters, CNC, CAD, Electronics), not just school toys.
- Call to Action: "This is the future we want to build. Can you help us fund the vehicle to make it real?"

GOVERNANCE TEAM:
- Clark Williams: Founder & Lead (10 years STEAM experience, Boma Fellow).
- Irihāpeti Mahuika: Governance (CEO Health Hawke's Bay, focus on equity).
- Pania Watson: Education Specialist.
- Lex Davis: Strategic Operations.

FORMATTING RULES (STRICT):
1.  NO BOLDING: Do not use markdown bolding (asterisks) anywhere. The chat interface does not support it. Use plain text only.
2.  Clean Contact Info: Do not use brackets or markdown links for emails or phone numbers. Write them as plain text (e.g., Clark@inertiaed.org).
3.  Readable Layout: Use bullet points and paragraph breaks to keep the text easy to scan.

CONTACT:
Clark Williams (Founder) - Clark@inertiaed.org - 0273033790
`;
