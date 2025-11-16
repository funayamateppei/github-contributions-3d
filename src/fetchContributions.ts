import { Octokit } from '@octokit/rest';

export interface ContributionDay {
  week: number;
  day: number;
  count: number;
  date: string;
  color: string;
}

export interface ContributionData {
  contributions: ContributionDay[];
  totalContributions: number;
  weeks: number;
}

interface GraphQLResponse {
  user: {
    contributionsCollection: {
      contributionCalendar: {
        totalContributions: number;
        weeks: Array<{
          contributionDays: Array<{
            contributionCount: number;
            date: string;
            color: string;
          }>;
        }>;
      };
    };
  };
}

/**
 * Fetch GitHub contribution data for a user
 */
export async function fetchContributions(
  username: string,
  token: string | null = null
): Promise<ContributionData> {
  const octokit = token ? new Octokit({ auth: token }) : new Octokit();

  // GraphQL query to get contribution calendar
  const query = `
    query($username: String!) {
      user(login: $username) {
        contributionsCollection {
          contributionCalendar {
            totalContributions
            weeks {
              contributionDays {
                contributionCount
                date
                color
              }
            }
          }
        }
      }
    }
  `;

  try {
    const response = await octokit.graphql<GraphQLResponse>(query, { username });
    const weeks = response.user.contributionsCollection.contributionCalendar.weeks;

    // Convert to a more usable format
    const contributions: ContributionDay[] = [];
    weeks.forEach((week, weekIndex) => {
      week.contributionDays.forEach((day, dayIndex) => {
        contributions.push({
          week: weekIndex,
          day: dayIndex,
          count: day.contributionCount,
          date: day.date,
          color: day.color
        });
      });
    });

    return {
      contributions,
      totalContributions: response.user.contributionsCollection.contributionCalendar.totalContributions,
      weeks: weeks.length
    };
  } catch (error) {
    console.error('Error fetching contributions:', error);
    throw error;
  }
}
