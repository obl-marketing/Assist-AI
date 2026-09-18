import { Vertical } from '@prisma/client';

export interface CategorySeed {
  key: string;
  name: string;
  blurb?: string;
}

export interface VerticalSeed {
  key: Vertical;
  name: string;
  emoji: string;
  tagline: string;
  categories: CategorySeed[];
}

/**
 * FREED's five founding supply verticals. This is the taxonomy the marketplace
 * launches with — breadth grows later, but supply is built vertical by vertical.
 */
export const VERTICALS: VerticalSeed[] = [
  {
    key: Vertical.EXAMS_ACADEMICS,
    name: 'Exams & Academics',
    emoji: '🎓',
    tagline: 'Talk to someone who cleared it.',
    categories: [
      { key: 'jee-mains', name: 'IIT-JEE Mains' },
      { key: 'jee-advanced', name: 'IIT-JEE Advanced' },
      { key: 'neet', name: 'NEET' },
      { key: 'gate-cse', name: 'GATE CSE' },
      { key: 'gate-ece', name: 'GATE ECE' },
      { key: 'gate-me', name: 'GATE ME' },
      { key: 'gate-ee', name: 'GATE EE' },
      { key: 'ese-ies', name: 'ESE / IES' },
      { key: 'je', name: 'JE' },
      { key: 'ssc', name: 'SSC' },
      { key: 'banking', name: 'Banking' },
      { key: 'upsc', name: 'UPSC' },
      { key: 'state-psc', name: 'State PSC' },
      { key: 'psu', name: 'PSU preparation' },
      { key: 'cat', name: 'CAT' },
      { key: 'clat', name: 'CLAT' },
      { key: 'cuet', name: 'CUET' },
      { key: 'nursing-exams', name: 'Nursing exams' },
      { key: 'defence-exams', name: 'Defence exams' },
      { key: 'ugc-net', name: 'UGC-NET' },
      { key: 'csir-net', name: 'CSIR-NET' },
      { key: 'jrf', name: 'JRF' },
      { key: 'phd-guidance', name: 'PhD guidance' },
      { key: 'research', name: 'Research careers' },
    ],
  },
  {
    key: Vertical.CAREER_PROFESSIONAL,
    name: 'Career & Professional',
    emoji: '💼',
    tagline: 'Talk to someone a few steps ahead.',
    categories: [
      { key: 'career-counselling', name: 'Career counselling' },
      { key: 'career-transition', name: 'Career change' },
      { key: 'product-management', name: 'Product management' },
      { key: 'software-engineering', name: 'Software engineering' },
      { key: 'data-science', name: 'Data science' },
      { key: 'design', name: 'Design' },
      { key: 'hr-recruiting', name: 'HR & recruiting' },
      { key: 'finance', name: 'Finance' },
      { key: 'consulting', name: 'Consulting' },
      { key: 'entrepreneurship', name: 'Entrepreneurship' },
      { key: 'leadership', name: 'Leadership' },
      { key: 'interview-prep', name: 'Interview preparation' },
      { key: 'resume-review', name: 'Resume review' },
      { key: 'salary-negotiation', name: 'Salary negotiation' },
      { key: 'mba-mentorship', name: 'MBA mentorship' },
      { key: 'study-abroad', name: 'Study abroad' },
    ],
  },
  {
    key: Vertical.SPORTS_PERFORMANCE,
    name: 'Sports & Performance',
    emoji: '🏅',
    tagline: 'Learn from those who competed.',
    categories: [
      { key: 'cricket', name: 'Cricket' },
      { key: 'football', name: 'Football' },
      { key: 'badminton', name: 'Badminton' },
      { key: 'athletics', name: 'Athletics' },
      { key: 'swimming', name: 'Swimming' },
      { key: 'boxing', name: 'Boxing' },
      { key: 'wrestling', name: 'Wrestling' },
      { key: 'hockey', name: 'Hockey' },
      { key: 'tennis', name: 'Tennis' },
      { key: 'table-tennis', name: 'Table tennis' },
      { key: 'shooting', name: 'Shooting' },
      { key: 'archery', name: 'Archery' },
      { key: 'weightlifting', name: 'Weightlifting' },
      { key: 'sports-psychology', name: 'Sports psychology' },
      { key: 'strength-conditioning', name: 'Strength & conditioning' },
      { key: 'sports-nutrition', name: 'Sports nutrition' },
    ],
  },
  {
    key: Vertical.TEACHING_KNOWLEDGE,
    name: 'Teaching & Knowledge',
    emoji: '📚',
    tagline: 'Learn a subject from a real practitioner.',
    categories: [
      { key: 'school-teachers', name: 'School teachers' },
      { key: 'professors', name: 'Professors' },
      { key: 'researchers', name: 'Researchers' },
      { key: 'scientists', name: 'Scientists' },
      { key: 'phd-mentors', name: 'PhD mentors' },
      { key: 'languages', name: 'Languages' },
      { key: 'coding', name: 'Coding' },
      { key: 'music', name: 'Music' },
      { key: 'art', name: 'Art' },
      { key: 'technical-skills', name: 'Technical skills' },
    ],
  },
  {
    key: Vertical.WELLNESS_GUIDANCE,
    name: 'Wellness & Guidance',
    emoji: '🧠',
    tagline: 'Speak with the right kind of professional.',
    categories: [
      // Clinical / registered — stricter verification, clearly labelled.
      { key: 'clinical-psychology', name: 'Clinical psychology', blurb: 'Registered professional' },
      { key: 'counselling', name: 'Counselling', blurb: 'Qualified professional' },
      // Non-clinical guidance — labelled as coaching, never as care.
      { key: 'life-coaching', name: 'Life coaching', blurb: 'Coach' },
      { key: 'relationship-coaching', name: 'Relationship coaching', blurb: 'Coach' },
      { key: 'wellness-coaching', name: 'Wellness coaching', blurb: 'Coach' },
      { key: 'productivity', name: 'Productivity', blurb: 'Coach' },
      { key: 'meditation', name: 'Meditation', blurb: 'Instructor' },
      { key: 'personal-growth', name: 'Personal growth', blurb: 'Mentor' },
    ],
  },
];
