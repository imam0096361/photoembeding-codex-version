import { EventTemplate } from '../types';

/**
 * TDS PhotoArchivePRO - Event Templates
 * 
 * Pre-configured templates for common newsroom scenarios
 * to improve AI accuracy and consistency.
 */

export const EVENT_TEMPLATES: EventTemplate[] = [
    // POLITICS
    {
        id: 'parliament_session',
        name: 'Parliament Session',
        description: 'Jatiya Sangsad proceedings, budget sessions, bill discussions',
        category: 'politics',
        contextPrompt: 'This photo is from a Bangladesh Parliament (Jatiya Sangsad) session in Dhaka. The building is the iconic Jatiya Sangsad Bhaban designed by Louis Kahn. Key figures to identify: Speaker, MPs, Ministers.',
        suggestedKeywords: ['parliament', 'jatiyasangsad', 'speaker', 'mp', 'legislation', 'dhaka', 'government', 'democracy', 'session', 'lawmaker'],
        knownFigures: ['Shafiqul Islam Masud', 'Sheikh Hasina', 'Obaidul Quader']
    },
    {
        id: 'press_conference',
        name: 'Press Conference',
        description: 'Official announcements, media briefings, press statements',
        category: 'politics',
        contextPrompt: 'This is a press conference or media briefing in Bangladesh. Look for: podium, microphones, press backdrop, journalists. Identify speakers by name badges or known visual features.',
        suggestedKeywords: ['pressconference', 'briefing', 'media', 'announcement', 'journalists', 'microphone', 'statement', 'official', 'spokesperson', 'press'],
        knownFigures: []
    },
    {
        id: 'political_rally',
        name: 'Political Rally',
        description: 'Party gatherings, election campaigns, public meetings',
        category: 'politics',
        contextPrompt: 'This is a political rally or public meeting in Bangladesh. Look for: party flags, banners, crowd size, stage setup. Identify party by colors (AL: green, BNP: yellow/red, JP: yellow).',
        suggestedKeywords: ['rally', 'political', 'crowd', 'supporters', 'election', 'campaign', 'gathering', 'protest', 'democracy', 'voters'],
        knownFigures: []
    },
    {
        id: 'diplomatic_meeting',
        name: 'Diplomatic Meeting',
        description: 'Foreign dignitaries, bilateral talks, embassy events',
        category: 'international',
        contextPrompt: 'This is a diplomatic meeting or international event in Bangladesh. Look for: national flags, formal setting, handshakes, delegation tables.',
        suggestedKeywords: ['diplomacy', 'bilateral', 'ambassador', 'foreignminister', 'delegation', 'international', 'treaty', 'cooperation', 'embassy', 'summit'],
        knownFigures: ['A.K. Abdul Momen', 'Sheikh Hasina']
    },

    // SPORTS - Cricket
    {
        id: 'cricket_match',
        name: 'Cricket Match',
        description: 'International/domestic cricket, BPL, practice sessions',
        category: 'sports',
        contextPrompt: 'This is a cricket match in Bangladesh. Identify: venue (Sher-e-Bangla, Zahur Ahmed Chowdhury Stadium), team jerseys, players by number/face. BCB logo context.',
        suggestedKeywords: ['cricket', 'bangladesh', 'tigers', 'batsman', 'bowler', 'wicket', 'match', 'stadium', 'bcb', 'bpl'],
        knownFigures: ['Shakib Al Hasan', 'Tamim Iqbal', 'Mushfiqur Rahim', 'Najmul Hossain Shanto', 'Litton Das', 'Taskin Ahmed']
    },
    {
        id: 'cricket_press',
        name: 'Cricket Press Event',
        description: 'Team announcements, player interviews, BCB briefings',
        category: 'sports',
        contextPrompt: 'This is a Bangladesh Cricket Board (BCB) press event or player interview. Look for: BCB backdrop, team jerseys, microphones.',
        suggestedKeywords: ['cricket', 'bcb', 'pressconference', 'captain', 'coach', 'team', 'announcement', 'interview', 'squad', 'selection'],
        knownFigures: ['Nazmul Hassan Papon', 'Shakib Al Hasan']
    },
    {
        id: 'football_match',
        name: 'Football Match',
        description: 'National team, BPL football, FIFA qualifiers',
        category: 'sports',
        contextPrompt: 'This is a football match in Bangladesh. Look for: national team jersey (green), BFF logo, stadium details.',
        suggestedKeywords: ['football', 'soccer', 'bangladesh', 'bff', 'match', 'goal', 'stadium', 'nationalteam', 'players', 'worldcup'],
        knownFigures: ['Jamal Bhuiyan', 'Kazi Salahuddin']
    },

    // DISASTERS & EMERGENCIES
    {
        id: 'flood_coverage',
        name: 'Flood Coverage',
        description: 'Monsoon flooding, relief operations, displacement',
        category: 'national',
        contextPrompt: 'This photo covers flooding in Bangladesh. Look for: water levels, affected areas, relief boats, displaced people, relief distribution.',
        suggestedKeywords: ['flood', 'monsoon', 'disaster', 'relief', 'rescue', 'displacement', 'waterlogging', 'climate', 'humanitarian', 'shelter'],
        knownFigures: []
    },
    {
        id: 'cyclone_coverage',
        name: 'Cyclone Coverage',
        description: 'Storm damage, evacuation, coastal disaster',
        category: 'national',
        contextPrompt: 'This photo covers cyclone impact in Bangladesh coastal areas. Look for: damage assessment, shelters, rescue operations, coastal communities.',
        suggestedKeywords: ['cyclone', 'storm', 'coastal', 'disaster', 'evacuation', 'shelter', 'damage', 'rescue', 'relief', 'bayofbengal'],
        knownFigures: []
    },

    // BUSINESS & ECONOMY
    {
        id: 'business_event',
        name: 'Business Event',
        description: 'Corporate announcements, trade fairs, economic summits',
        category: 'business',
        contextPrompt: 'This is a business or economic event in Bangladesh. Look for: corporate branding, exhibition booths, executive attire, conference settings.',
        suggestedKeywords: ['business', 'corporate', 'economy', 'trade', 'investment', 'conference', 'ceo', 'industry', 'commerce', 'export'],
        knownFigures: ['Salman F Rahman', 'Muhammad Yunus']
    },
    {
        id: 'garment_factory',
        name: 'Garment Industry',
        description: 'RMG sector, factory visits, labor stories',
        category: 'business',
        contextPrompt: 'This photo is from the Bangladesh garment/RMG industry. Look for: factory floor, workers, sewing machines, fabric, compliance signage.',
        suggestedKeywords: ['garment', 'rmg', 'factory', 'textile', 'workers', 'export', 'fashion', 'manufacturing', 'labor', 'bgmea'],
        knownFigures: []
    },

    // CULTURE & LIFESTYLE
    {
        id: 'cultural_festival',
        name: 'Cultural Festival',
        description: 'Pohela Boishakh, Eid, Durga Puja, cultural programs',
        category: 'lifestyle',
        contextPrompt: 'This is a cultural event or festival in Bangladesh. Look for: traditional dress, decorations, performances, food, celebrations.',
        suggestedKeywords: ['culture', 'festival', 'celebration', 'tradition', 'heritage', 'bengali', 'music', 'dance', 'art', 'folklore'],
        knownFigures: []
    },
    {
        id: 'eid_celebration',
        name: 'Eid Celebration',
        description: 'Eid ul-Fitr, Eid ul-Adha, prayers, festivities',
        category: 'lifestyle',
        contextPrompt: 'This photo covers Eid celebrations in Bangladesh. Look for: Eid prayers, greetings, traditional dress, food, family gatherings.',
        suggestedKeywords: ['eid', 'muslim', 'celebration', 'prayer', 'mosque', 'festival', 'family', 'tradition', 'holiday', 'bangladesh'],
        knownFigures: []
    },

    // CRIME & JUSTICE
    {
        id: 'court_proceedings',
        name: 'Court Proceedings',
        description: 'Supreme Court, High Court, tribunal hearings',
        category: 'crime',
        contextPrompt: 'This photo is from court proceedings in Bangladesh. Look for: judges, lawyers, court room, legal attire, security.',
        suggestedKeywords: ['court', 'justice', 'legal', 'judge', 'lawyer', 'verdict', 'trial', 'supremecourt', 'highcourt', 'law'],
        knownFigures: []
    },
    {
        id: 'protest',
        name: 'Public Protest',
        description: 'Demonstrations, strikes, civil movements',
        category: 'national',
        contextPrompt: 'This photo covers a protest or demonstration in Bangladesh. Look for: banners, placards, crowd chants, location, police presence.',
        suggestedKeywords: ['protest', 'demonstration', 'strike', 'movement', 'activists', 'rights', 'demand', 'rally', 'civil', 'public'],
        knownFigures: []
    },

    // EDUCATION
    {
        id: 'education_event',
        name: 'Education Event',
        description: 'University events, exams, graduation, school programs',
        category: 'national',
        contextPrompt: 'This is an education-related event in Bangladesh. Look for: universities, students, academic dress, classrooms, exam halls.',
        suggestedKeywords: ['education', 'university', 'students', 'graduation', 'academic', 'school', 'college', 'examination', 'campus', 'learning'],
        knownFigures: []
    }
];

/**
 * Get template by ID
 */
export function getTemplateById(id: string): EventTemplate | undefined {
    return EVENT_TEMPLATES.find(t => t.id === id);
}

/**
 * Get templates by category
 */
export function getTemplatesByCategory(category: string): EventTemplate[] {
    return EVENT_TEMPLATES.filter(t => t.category === category);
}

/**
 * Search templates by keyword
 */
export function searchTemplates(query: string): EventTemplate[] {
    const lowerQuery = query.toLowerCase();
    return EVENT_TEMPLATES.filter(t =>
        t.name.toLowerCase().includes(lowerQuery) ||
        t.description.toLowerCase().includes(lowerQuery) ||
        t.suggestedKeywords.some(k => k.includes(lowerQuery))
    );
}
