// Squad Scramble - Team Generation Utilities
// Algorithms and helpers for generating random, balanced teams

/**
 * Fun team names for auto-generation
 */
export const TEAM_NAMES = [
  '🔥 Fire Dragons',
  '⚡ Thunder Bolts',
  '🌊 Wave Riders',
  '🌟 Star Crushers',
  '🎯 Bull\'s Eye',
  '🚀 Space Rangers',
  '💎 Diamond Squad',
  '🦁 Mighty Lions',
  '🎪 Party Legends',
  '🎨 Creative Minds',
  '🏆 Champions',
  '🎵 Rhythm Masters',
  '🌈 Rainbow Warriors',
  '⚔️ Knight Squad',
  '🎭 Drama Kings',
  '🧙 Wizard Team',
  '🦸 Super Squad',
  '🎸 Rock Stars',
  '🌺 Flower Power',
  '🔮 Crystal Crew',
  '🎯 Target Team',
  '🏴‍☠️ Pirates',
  '🦄 Unicorn Force',
  '🐉 Dragon Riders',
  '🌪️ Tornado Team',
  '🎆 Sparkle Squad',
  '🌙 Moon Knights',
  '☀️ Sun Squad',
  '⭐ All Stars',
  '🎊 Celebration Crew'
];

/**
 * Team color schemes matching Name Roulette design
 */
export const TEAM_COLORS = [
  {
    bg: 'from-purple-500 to-pink-500',
    border: 'purple-400',
    text: 'white',
    glow: 'purple'
  },
  {
    bg: 'from-blue-500 to-cyan-500',
    border: 'cyan-400',
    text: 'white',
    glow: 'cyan'
  },
  {
    bg: 'from-green-500 to-emerald-500',
    border: 'green-400',
    text: 'white',
    glow: 'green'
  },
  {
    bg: 'from-orange-500 to-red-500',
    border: 'orange-400',
    text: 'white',
    glow: 'orange'
  },
  {
    bg: 'from-yellow-500 to-amber-500',
    border: 'yellow-400',
    text: 'white',
    glow: 'yellow'
  },
  {
    bg: 'from-indigo-500 to-purple-500',
    border: 'indigo-400',
    text: 'white',
    glow: 'indigo'
  },
  {
    bg: 'from-pink-500 to-rose-500',
    border: 'pink-400',
    text: 'white',
    glow: 'pink'
  },
  {
    bg: 'from-teal-500 to-cyan-500',
    border: 'teal-400',
    text: 'white',
    glow: 'teal'
  },
  {
    bg: 'from-lime-500 to-green-500',
    border: 'lime-400',
    text: 'white',
    glow: 'lime'
  },
  {
    bg: 'from-violet-500 to-purple-500',
    border: 'violet-400',
    text: 'white',
    glow: 'violet'
  }
];

/**
 * Shuffle an array using Fisher-Yates algorithm
 * @param {Array} array - Array to shuffle
 * @returns {Array} - Shuffled array (new copy)
 */
export const shuffleArray = (array) => {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
};

/**
 * Get a random selection of team names
 * @param {number} count - Number of team names needed
 * @returns {Array<string>} - Array of unique team names
 */
export const getRandomTeamNames = (count) => {
  const shuffled = shuffleArray(TEAM_NAMES);
  return shuffled.slice(0, count);
};

/**
 * Generate teams by specifying number of teams
 * @param {Array<Object>} participants - Array of participant objects with {id, name}
 * @param {number} teamCount - Number of teams to create
 * @returns {Object} - Generation result with teams array and metadata
 */
export const generateTeamsByCount = (participants, teamCount) => {
  if (participants.length < teamCount) {
    throw new Error(`Need at least ${teamCount} participants to create ${teamCount} teams`);
  }

  if (teamCount < 2) {
    throw new Error('Must create at least 2 teams');
  }

  // Shuffle participants for randomness
  const shuffled = shuffleArray(participants);

  // Create empty teams
  const teams = Array.from({ length: teamCount }, () => []);

  // Distribute participants round-robin for balanced teams
  shuffled.forEach((participant, index) => {
    teams[index % teamCount].push(participant);
  });

  // Get random team names
  const teamNames = getRandomTeamNames(teamCount);

  // Format teams with metadata
  const formattedTeams = teams.map((members, index) => ({
    teamNumber: index + 1,
    name: teamNames[index],
    color: TEAM_COLORS[index % TEAM_COLORS.length],
    members: members,
    captain: null // Will be set separately if needed
  }));

  return {
    teams: formattedTeams,
    mode: 'team_count',
    teamCount: teamCount,
    actualTeamsCreated: teamCount,
    totalParticipants: participants.length,
    averageTeamSize: Math.floor(participants.length / teamCount)
  };
};

/**
 * Generate teams by specifying team size
 * @param {Array<Object>} participants - Array of participant objects with {id, name}
 * @param {number} teamSize - Desired size per team
 * @returns {Object} - Generation result with teams array and metadata
 */
export const generateTeamsBySize = (participants, teamSize) => {
  if (teamSize < 1) {
    throw new Error('Team size must be at least 1');
  }

  if (participants.length < teamSize) {
    throw new Error(`Need at least ${teamSize} participants to create teams of size ${teamSize}`);
  }

  // Calculate number of teams needed
  const teamCount = Math.ceil(participants.length / teamSize);

  if (teamCount < 2) {
    throw new Error('Configuration would only create 1 team. Increase team size or add more participants.');
  }

  // Shuffle participants for randomness
  const shuffled = shuffleArray(participants);

  // Create teams by filling each team to desired size
  const teams = [];
  let currentTeam = [];

  shuffled.forEach((participant) => {
    currentTeam.push(participant);

    // When team reaches desired size, start new team
    if (currentTeam.length === teamSize) {
      teams.push(currentTeam);
      currentTeam = [];
    }
  });

  // Add remaining participants to last team (if any)
  if (currentTeam.length > 0) {
    teams.push(currentTeam);
  }

  // Get random team names
  const teamNames = getRandomTeamNames(teams.length);

  // Format teams with metadata
  const formattedTeams = teams.map((members, index) => ({
    teamNumber: index + 1,
    name: teamNames[index],
    color: TEAM_COLORS[index % TEAM_COLORS.length],
    members: members,
    captain: null // Will be set separately if needed
  }));

  return {
    teams: formattedTeams,
    mode: 'team_size',
    teamSize: teamSize,
    actualTeamsCreated: teams.length,
    totalParticipants: participants.length,
    averageTeamSize: Math.floor(participants.length / teams.length)
  };
};

/**
 * Automatically select captains for teams (random selection)
 * @param {Array<Object>} teams - Array of team objects
 * @returns {Array<Object>} - Teams with captains assigned
 */
export const assignRandomCaptains = (teams) => {
  return teams.map(team => {
    if (team.members.length === 0) {
      return { ...team, captain: null };
    }

    // Pick random member as captain
    const randomIndex = Math.floor(Math.random() * team.members.length);
    const captain = team.members[randomIndex];

    return {
      ...team,
      captain: captain
    };
  });
};

/**
 * Manually set a captain for a specific team
 * @param {Array<Object>} teams - Array of team objects
 * @param {number} teamNumber - Team number (1-indexed)
 * @param {Object} captain - Participant object to set as captain
 * @returns {Array<Object>} - Updated teams array
 */
export const setCaptain = (teams, teamNumber, captain) => {
  return teams.map(team => {
    if (team.teamNumber === teamNumber) {
      // Verify captain is in the team
      const isMember = team.members.some(m => m.id === captain.id);
      if (!isMember) {
        throw new Error(`Captain ${captain.name} is not a member of ${team.name}`);
      }
      return { ...team, captain: captain };
    }
    return team;
  });
};

/**
 * Move a participant from one team to another
 * @param {Array<Object>} teams - Array of team objects
 * @param {Object} participant - Participant to move
 * @param {number} fromTeamNumber - Source team number (1-indexed)
 * @param {number} toTeamNumber - Destination team number (1-indexed)
 * @returns {Array<Object>} - Updated teams array
 */
export const moveParticipant = (teams, participant, fromTeamNumber, toTeamNumber) => {
  if (fromTeamNumber === toTeamNumber) {
    return teams; // No change needed
  }

  return teams.map(team => {
    // Remove from source team
    if (team.teamNumber === fromTeamNumber) {
      const newMembers = team.members.filter(m => m.id !== participant.id);
      const newCaptain = team.captain?.id === participant.id ? null : team.captain;
      return { ...team, members: newMembers, captain: newCaptain };
    }

    // Add to destination team
    if (team.teamNumber === toTeamNumber) {
      const newMembers = [...team.members, participant];
      return { ...team, members: newMembers };
    }

    return team;
  });
};

/**
 * Update team name
 * @param {Array<Object>} teams - Array of team objects
 * @param {number} teamNumber - Team number (1-indexed)
 * @param {string} newName - New team name
 * @returns {Array<Object>} - Updated teams array
 */
export const updateTeamName = (teams, teamNumber, newName) => {
  return teams.map(team => {
    if (team.teamNumber === teamNumber) {
      return { ...team, name: newName };
    }
    return team;
  });
};

/**
 * Validate team generation parameters
 * @param {string} mode - 'team_count' or 'team_size'
 * @param {number} value - The count or size value
 * @param {number} participantCount - Total number of participants
 * @returns {Object} - {valid: boolean, error: string}
 */
export const validateTeamParams = (mode, value, participantCount) => {
  if (participantCount < 2) {
    return {
      valid: false,
      error: 'Need at least 2 participants to generate teams'
    };
  }

  if (mode === 'team_count') {
    if (value < 2) {
      return { valid: false, error: 'Must create at least 2 teams' };
    }
    if (value > participantCount) {
      return {
        valid: false,
        error: `Cannot create ${value} teams with only ${participantCount} participants`
      };
    }
  }

  if (mode === 'team_size') {
    if (value < 1) {
      return { valid: false, error: 'Team size must be at least 1' };
    }
    if (value > participantCount) {
      return {
        valid: false,
        error: `Team size (${value}) cannot be larger than total participants (${participantCount})`
      };
    }
    const wouldCreateTeams = Math.ceil(participantCount / value);
    if (wouldCreateTeams < 2) {
      return {
        valid: false,
        error: `This would only create 1 team. Use a smaller team size.`
      };
    }
  }

  return { valid: true, error: null };
};
