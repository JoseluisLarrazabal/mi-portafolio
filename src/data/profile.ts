export interface Profile {
  name: string;
  title: string;
  location: string;
  bio: string;
  skills: {
    languages: string[];
    frameworks: string[];
    data: string[];
    cloud: string[];
    design: string[];
  };
  education: string;
  languages: string[];
  contact: { email: string; github: string; linkedin?: string };
}

export const profile: Profile = {
  name: 'Jose Luis Larrazabal',
  title: 'Full-stack Software Engineer · CTO',
  location: 'Bolivia',
  bio: 'Semi-senior full-stack engineer building AI and LLM-powered applications. For about two years I have built and led production platforms end to end, as cofounder and CTO of Reeteil and Quivo. I focus on distributed systems, cloud infrastructure and fintech / digital payments, and I won seed funding from IncubaLab Bolivia.',
  skills: {
    languages: ['C#', 'JavaScript', 'TypeScript', 'Go', 'Java', 'SQL'],
    frameworks: ['React', 'React Native', 'Next.js', 'Flutter', 'Node.js', 'SvelteKit', 'ASP.NET MVC'],
    data: ['PostgreSQL', 'MySQL', 'Redis', 'Data Warehouse'],
    cloud: ['GCP (Cloud Run, Cloud SQL, Pub/Sub)', 'Docker', 'CI/CD', 'Vercel', 'Supabase'],
    design: ['Figma (prototyping, design systems)'],
  },
  education: 'Systems Engineering — Universidad Privada del Valle (UNIVALLE), expected 2026',
  languages: ['Spanish (native)', 'English (professional)', 'Swedish (basic)'],
  contact: {
    email: 'cto.josel@team.myquivo.com',
    github: 'https://github.com/JoseluisLarrazabal',
    linkedin: undefined,
  },
};
