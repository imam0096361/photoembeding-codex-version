import { KnownFigure } from '../types';

/**
 * TDS PhotoArchivePRO - Known Figures Database
 * 
 * This database contains frequently photographed public figures in Bangladesh
 * for improved AI recognition accuracy.
 * 
 * Categories: politics, sports, entertainment, business, other
 */

export const KNOWN_FIGURES: KnownFigure[] = [
    // POLITICS - Government & Opposition Leaders
    {
        name: "Sheikh Hasina",
        titles: ["Prime Minister of Bangladesh", "Leader of Awami League", "Chairperson of Awami League"],
        aliases: ["Sheikh Hasina Wazed", "PM Hasina"],
        party: "Awami League",
        visualCues: ["distinctive saree style", "glasses"],
        category: "politics"
    },
    {
        name: "Khaleda Zia",
        titles: ["Former Prime Minister", "Chairperson of BNP"],
        aliases: ["Begum Khaleda Zia", "Begum Zia"],
        party: "Bangladesh Nationalist Party",
        category: "politics"
    },
    {
        name: "Mirza Fakhrul Islam Alamgir",
        titles: ["Secretary General of BNP", "BNP Standing Committee Member"],
        party: "Bangladesh Nationalist Party",
        category: "politics"
    },
    {
        name: "Obaidul Quader",
        titles: ["General Secretary of Awami League", "Road Transport Minister"],
        party: "Awami League",
        category: "politics"
    },
    {
        name: "A.K. Abdul Momen",
        titles: ["Foreign Minister of Bangladesh"],
        aliases: ["Dr. A.K. Abdul Momen"],
        party: "Awami League",
        category: "politics"
    },
    {
        name: "Shafiqul Islam Masud",
        titles: ["Speaker of Parliament", "Jatiya Sangsad Speaker"],
        party: "Awami League",
        category: "politics"
    },
    {
        name: "Muhammad Yunus",
        titles: ["Nobel Laureate", "Founder of Grameen Bank", "Economist"],
        aliases: ["Dr. Muhammad Yunus", "Prof. Yunus"],
        organization: "Grameen Bank",
        category: "business"
    },
    {
        name: "Tarique Rahman",
        titles: ["Acting Chairman of BNP", "Senior Vice Chairman of BNP"],
        party: "Bangladesh Nationalist Party",
        category: "politics"
    },
    {
        name: "GM Quader",
        titles: ["Chairman of Jatiya Party", "Deputy Leader of Opposition"],
        party: "Jatiya Party",
        category: "politics"
    },

    // SPORTS - Cricket
    {
        name: "Shakib Al Hasan",
        titles: ["Captain of Bangladesh Cricket Team", "All-rounder", "BCB Central Contract Player"],
        aliases: ["Shakib"],
        organization: "Bangladesh Cricket Board",
        visualCues: ["left-handed batsman"],
        category: "sports"
    },
    {
        name: "Tamim Iqbal",
        titles: ["Former ODI Captain", "Opening Batsman", "BCB Central Contract Player"],
        aliases: ["Tamim"],
        organization: "Bangladesh Cricket Board",
        category: "sports"
    },
    {
        name: "Mushfiqur Rahim",
        titles: ["Wicketkeeper-batsman", "Former Captain", "BCB Central Contract Player"],
        aliases: ["Mushfiq", "Mushi"],
        organization: "Bangladesh Cricket Board",
        category: "sports"
    },
    {
        name: "Mashrafe Bin Mortaza",
        titles: ["Former ODI Captain", "Member of Parliament", "Legendary Pacer"],
        aliases: ["Mashrafe", "Narail Express"],
        party: "Awami League",
        organization: "Bangladesh Cricket Board",
        category: "sports"
    },
    {
        name: "Najmul Hossain Shanto",
        titles: ["Test Captain", "Batsman", "BCB Central Contract Player"],
        aliases: ["Shanto"],
        organization: "Bangladesh Cricket Board",
        category: "sports"
    },
    {
        name: "Litton Das",
        titles: ["Wicketkeeper-batsman", "BCB Central Contract Player"],
        aliases: ["Litton"],
        organization: "Bangladesh Cricket Board",
        category: "sports"
    },
    {
        name: "Taskin Ahmed",
        titles: ["Fast Bowler", "BCB Central Contract Player"],
        aliases: ["Taskin"],
        organization: "Bangladesh Cricket Board",
        category: "sports"
    },
    {
        name: "Nazmul Hassan Papon",
        titles: ["President of Bangladesh Cricket Board", "BCB President"],
        aliases: ["Papon"],
        organization: "Bangladesh Cricket Board",
        category: "sports"
    },

    // SPORTS - Football
    {
        name: "Jamal Bhuiyan",
        titles: ["Captain of Bangladesh Football Team", "Midfielder"],
        organization: "Bangladesh Football Federation",
        category: "sports"
    },
    {
        name: "Kazi Salahuddin",
        titles: ["President of Bangladesh Football Federation", "Former National Team Captain"],
        aliases: ["Kazi Salahuddin Ahmed"],
        organization: "Bangladesh Football Federation",
        category: "sports"
    },

    // ENTERTAINMENT
    {
        name: "Tahsan Rahman Khan",
        titles: ["Singer", "Actor", "Musician"],
        aliases: ["Tahsan"],
        category: "entertainment"
    },
    {
        name: "Shakib Khan",
        titles: ["Film Actor", "Dhallywood Superstar"],
        aliases: ["Shakib"],
        category: "entertainment"
    },
    {
        name: "Jaya Ahsan",
        titles: ["Film Actress", "National Film Award Winner"],
        category: "entertainment"
    },
    {
        name: "Mithila",
        titles: ["Actress", "Singer"],
        aliases: ["Rafiath Rashid Mithila"],
        category: "entertainment"
    },

    // BUSINESS
    {
        name: "Salman F Rahman",
        titles: ["Private Sector Advisor to PM", "Chairman of Beximco Group"],
        organization: "Beximco Group",
        party: "Awami League",
        category: "business"
    },
    {
        name: "Syed Manzur Elahi",
        titles: ["Chairman of Apex Group"],
        organization: "Apex Group",
        category: "business"
    },
    {
        name: "A Rouf Chowdhury",
        titles: ["Chairman of Bank Asia"],
        organization: "Bank Asia",
        category: "business"
    },

    // OTHER - Activists, Scholars
    {
        name: "Sultana Kamal",
        titles: ["Human Rights Activist", "Former Caretaker Government Advisor"],
        organization: "Ain o Salish Kendra",
        category: "other"
    },
    {
        name: "Anu Muhammad",
        titles: ["Economist", "Professor", "Activist"],
        aliases: ["Professor Anu Muhammad"],
        organization: "Jahangirnagar University",
        category: "other"
    }
];

/**
 * Get figures by category for contextual prompts
 */
export function getFiguresByCategory(category: string): KnownFigure[] {
    return KNOWN_FIGURES.filter(f => f.category === category);
}

/**
 * Get figures by party for political events
 */
export function getFiguresByParty(party: string): KnownFigure[] {
    return KNOWN_FIGURES.filter(f => f.party?.toLowerCase().includes(party.toLowerCase()));
}

/**
 * Search figures by keyword in notes
 */
export function findRelevantFigures(notes: string): KnownFigure[] {
    const lowerNotes = notes.toLowerCase();
    return KNOWN_FIGURES.filter(f => {
        // Check name
        if (lowerNotes.includes(f.name.toLowerCase())) return true;
        // Check party
        if (f.party && lowerNotes.includes(f.party.toLowerCase())) return true;
        // Check organization
        if (f.organization && lowerNotes.includes(f.organization.toLowerCase())) return true;
        // Check aliases
        if (f.aliases?.some(a => lowerNotes.includes(a.toLowerCase()))) return true;
        // Check category keywords
        if (f.category === 'sports' && (lowerNotes.includes('cricket') || lowerNotes.includes('football') || lowerNotes.includes('match'))) return true;
        if (f.category === 'politics' && (lowerNotes.includes('parliament') || lowerNotes.includes('minister') || lowerNotes.includes('election'))) return true;
        return false;
    });
}

/**
 * Format figures for AI prompt injection
 */
export function formatFiguresForPrompt(figures: KnownFigure[]): string {
    if (figures.length === 0) return '';

    return `
KNOWN FIGURES REFERENCE (Use for identification if visually confirmed):
${figures.slice(0, 10).map(f => `- ${f.name}: ${f.titles[0]}${f.party ? ` (${f.party})` : ''}${f.visualCues ? ` [Visual: ${f.visualCues.join(', ')}]` : ''}`).join('\n')}
`;
}
