import { Octokit } from '@octokit/rest';

export interface ContributionDay {
  week: number;
  day: number;
  count: number;
  date: string;
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
          }>;
        }>;
      };
    };
  };
}

const MAX_ATTEMPTS = 5;
const RETRY_BASE_DELAY_MS = 2000;

const sleep = (ms: number): Promise<void> => new Promise(resolve => setTimeout(resolve, ms));

/**
 * GitHub は contribution カレンダーの取得を確率的に RESOURCE_LIMITS_EXCEEDED で拒否する。
 * クエリ自体は正しく、同じ内容でも数回に1回失敗するだけなので、リトライすれば通る。
 * 5xx も同様に一時的なものとして扱う。
 */
function isRetryable(error: unknown): boolean {
  const { errors, status } = (error ?? {}) as {
    errors?: Array<{ type?: string }>;
    status?: number;
  };

  if (errors?.some(e => e.type === 'RESOURCE_LIMITS_EXCEEDED')) {
    return true;
  }

  return status !== undefined && status >= 500;
}

/**
 * 指定ユーザーの GitHub contribution データを取得する
 */
export async function fetchContributions(
  username: string,
  token: string | null = null
): Promise<ContributionData> {
  const octokit = token ? new Octokit({ auth: token }) : new Octokit();

  // contribution カレンダーを取得する GraphQL クエリ。
  // 色は renderGif 側が count から算出するので color は要求しない。
  // 1年分の日ごとに color を展開すると GitHub のリソース上限を超えて
  // RESOURCE_LIMITS_EXCEEDED で失敗する。
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
              }
            }
          }
        }
      }
    }
  `;

  let lastError: unknown;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      const response = await octokit.graphql<GraphQLResponse>(query, { username });
      const weeks = response.user.contributionsCollection.contributionCalendar.weeks;

      // 扱いやすい形式に変換する
      const contributions: ContributionDay[] = [];
      weeks.forEach((week, weekIndex) => {
        week.contributionDays.forEach((day, dayIndex) => {
          contributions.push({
            week: weekIndex,
            day: dayIndex,
            count: day.contributionCount,
            date: day.date
          });
        });
      });

      return {
        contributions,
        totalContributions: response.user.contributionsCollection.contributionCalendar.totalContributions,
        weeks: weeks.length
      };
    } catch (error) {
      lastError = error;

      if (attempt === MAX_ATTEMPTS || !isRetryable(error)) {
        break;
      }

      const delay = RETRY_BASE_DELAY_MS * 2 ** (attempt - 1);
      console.warn(
        `Contribution の取得に失敗 (${attempt}/${MAX_ATTEMPTS} 回目)、${delay}ms 後にリトライします:`,
        error instanceof Error ? error.message : error
      );
      await sleep(delay);
    }
  }

  console.error('Error fetching contributions:', lastError);
  throw lastError;
}
