
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
  category: string;
  item: string;
  year1: number;
  annual: number;
}
