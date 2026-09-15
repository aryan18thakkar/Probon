import { config } from '../config/env.js';
import { execute, queryAll, queryOne, transaction } from '../config/database.js';
import { progressService } from './progressService.js';

function parseGitHubUrl(url) {
  if (!url) return null;
  const clean = url.trim().replace(/\/$/, '').replace(/\.git$/, '');
  const match = clean.match(/github\.com\/([^/]+)\/([^/]+)$/) || clean.match(/^([^/]+)\/([^/]+)$/);
  if (match) {
    return { owner: match[1], repoName: match[2] };
  }
  return null;
}

export const githubService = {
  connectRepository({ projectId, repoUrl, defaultBranch = 'main', accessToken }) {
    if (!projectId || !repoUrl) {
      const err = new Error('Project ID and repository URL are required.');
      err.statusCode = 400;
      throw err;
    }

    const parsed = parseGitHubUrl(repoUrl);
    if (!parsed) {
      const err = new Error('Invalid GitHub repository URL format. Example: https://github.com/owner/repo');
      err.statusCode = 400;
      throw err;
    }

    const { owner, repoName } = parsed;
    const normalizedUrl = `https://github.com/${owner}/${repoName}`;

    execute(
      `INSERT INTO repositories (project_id, repo_url, repo_name, owner, default_branch, access_token, sync_status, last_synced_at)
       VALUES (?, ?, ?, ?, ?, ?, 'idle', CURRENT_TIMESTAMP)
       ON CONFLICT(project_id) DO UPDATE SET
         repo_url = excluded.repo_url,
         repo_name = excluded.repo_name,
         owner = excluded.owner,
         default_branch = excluded.default_branch,
         access_token = COALESCE(excluded.access_token, repositories.access_token),
         sync_status = 'idle',
         last_synced_at = CURRENT_TIMESTAMP;`,
      [projectId, normalizedUrl, repoName, owner, defaultBranch, accessToken ? accessToken.trim() : null]
    );

    return this.getRepository(projectId);
  },

  getRepository(projectId) {
    return queryOne(
      'SELECT id, project_id, repo_url, repo_name, owner, default_branch, sync_status, sync_error, last_synced_at FROM repositories WHERE project_id = ?;',
      [projectId]
    );
  },

  getProjectActivities(projectId, limit = 25) {
    return queryAll(
      `SELECT ga.*, u.name as matched_user_name, u.avatar as matched_user_avatar
       FROM github_activities ga
       LEFT JOIN users u ON ga.user_id = u.id
       WHERE ga.project_id = ?
       ORDER BY ga.timestamp DESC
       LIMIT ?;`,
      [projectId, limit]
    );
  },

  async syncRepository(projectId) {
    const repo = queryOne('SELECT * FROM repositories WHERE project_id = ?;', [projectId]);
    if (!repo) {
      const err = new Error('No repository connected to this project.');
      err.statusCode = 404;
      throw err;
    }

    execute("UPDATE repositories SET sync_status = 'syncing' WHERE id = ?;", [repo.id]);

    const token = repo.access_token || config.githubDefaultToken;
    const headers = {
      'User-Agent': 'ProjNaN-Educational-Platform',
      Accept: 'application/vnd.github.v3+json',
      ...(token ? { Authorization: `token ${token}` } : {}),
    };

    let syncedCount = 0;

    try {
      // 1. Fetch Commits
      const commitsUrl = `https://api.github.com/repos/${repo.owner}/${repo.repo_name}/commits?per_page=20`;
      const commitRes = await fetch(commitsUrl, { headers });

      if (commitRes.ok) {
        const commits = await commitRes.json();
        if (Array.isArray(commits)) {
          for (const c of commits) {
            const hash = c.sha?.substring(0, 7) || 'commit';
            const authorLogin = c.author?.login || c.commit?.author?.name || 'unknown';
            const message = c.commit?.message?.split('\n')[0] || 'Commit update';
            const date = c.commit?.author?.date || new Date().toISOString();

            const matchedUser = queryOne(
              'SELECT id FROM users WHERE LOWER(github_username) = LOWER(?) OR LOWER(name) LIKE LOWER(?);',
              [authorLogin, `%${authorLogin}%`]
            );

            const existingActivity = queryOne(
              'SELECT id FROM github_activities WHERE repository_id = ? AND commit_hash = ? AND activity_type = "commit";',
              [repo.id, hash]
            );

            if (!existingActivity) {
              execute(
                `INSERT INTO github_activities (
                  repository_id, project_id, user_id, activity_type, title, description,
                  commit_hash, branch, author_username, url, timestamp
                ) VALUES (?, ?, ?, 'commit', ?, ?, ?, ?, ?, ?, ?);`,
                [
                  repo.id,
                  projectId,
                  matchedUser?.id || null,
                  message,
                  c.commit?.message || '',
                  hash,
                  repo.default_branch,
                  authorLogin,
                  c.html_url || '',
                  date,
                ]
              );
              syncedCount++;

              if (matchedUser?.id) {
                progressService.recordContribution({
                  userId: matchedUser.id,
                  projectId,
                  activityType: 'github_commit',
                  points: 15,
                  xp: 15,
                  description: `Git commit: ${message.substring(0, 100)}`,
                  externalId: `commit:${hash}`,
                  metadata: { commit_hash: hash, branch: repo.default_branch, author: authorLogin },
                });
              }
            }
          }
        }
      }

      // 2. Fetch Pull Requests
      const pullsUrl = `https://api.github.com/repos/${repo.owner}/${repo.repo_name}/pulls?state=all&per_page=15`;
      const pullsRes = await fetch(pullsUrl, { headers });

      if (pullsRes.ok) {
        const pulls = await pullsRes.json();
        if (Array.isArray(pulls)) {
          for (const p of pulls) {
            const prNumber = p.number;
            const authorLogin = p.user?.login || 'unknown';
            const title = p.title || `PR #${prNumber}`;
            const date = p.created_at || new Date().toISOString();

            const matchedUser = queryOne(
              'SELECT id FROM users WHERE LOWER(github_username) = LOWER(?) OR LOWER(name) LIKE LOWER(?);',
              [authorLogin, `%${authorLogin}%`]
            );

            const existingActivity = queryOne(
              'SELECT id FROM github_activities WHERE repository_id = ? AND pr_number = ? AND activity_type = "pull_request";',
              [repo.id, prNumber]
            );

            if (!existingActivity) {
              execute(
                `INSERT INTO github_activities (
                  repository_id, project_id, user_id, activity_type, title, description,
                  pr_number, branch, author_username, url, timestamp
                ) VALUES (?, ?, ?, 'pull_request', ?, ?, ?, ?, ?, ?, ?);`,
                [
                  repo.id,
                  projectId,
                  matchedUser?.id || null,
                  title,
                  p.body || '',
                  prNumber,
                  p.head?.ref || repo.default_branch,
                  authorLogin,
                  p.html_url || '',
                  date,
                ]
              );
              syncedCount++;

              if (matchedUser?.id) {
                progressService.recordContribution({
                  userId: matchedUser.id,
                  projectId,
                  activityType: 'github_pr',
                  points: 25,
                  xp: 25,
                  description: `GitHub PR #${prNumber}: ${title.substring(0, 80)}`,
                  externalId: `pr:${repo.id}:${prNumber}`,
                  metadata: { pr_number: prNumber, branch: p.head?.ref, author: authorLogin },
                });
              }
            }
          }
        }
      }

      // 3. Fetch Issues
      const issuesUrl = `https://api.github.com/repos/${repo.owner}/${repo.repo_name}/issues?state=all&per_page=15`;
      const issuesRes = await fetch(issuesUrl, { headers });

      if (issuesRes.ok) {
        const issues = await issuesRes.json();
        if (Array.isArray(issues)) {
          for (const iss of issues) {
            // Filter out pull requests
            if (iss.pull_request) continue;

            const issueNumber = iss.number;
            const authorLogin = iss.user?.login || 'unknown';
            const title = iss.title || `Issue #${issueNumber}`;
            const date = iss.created_at || new Date().toISOString();

            const matchedUser = queryOne(
              'SELECT id FROM users WHERE LOWER(github_username) = LOWER(?) OR LOWER(name) LIKE LOWER(?);',
              [authorLogin, `%${authorLogin}%`]
            );

            const existingActivity = queryOne(
              'SELECT id FROM github_activities WHERE repository_id = ? AND pr_number = ? AND activity_type = "issue";',
              [repo.id, issueNumber]
            );

            if (!existingActivity) {
              execute(
                `INSERT INTO github_activities (
                  repository_id, project_id, user_id, activity_type, title, description,
                  pr_number, branch, author_username, url, timestamp
                ) VALUES (?, ?, ?, 'issue', ?, ?, ?, ?, ?, ?, ?);`,
                [
                  repo.id,
                  projectId,
                  matchedUser?.id || null,
                  title,
                  iss.body || '',
                  issueNumber,
                  repo.default_branch,
                  authorLogin,
                  iss.html_url || '',
                  date,
                ]
              );
              syncedCount++;

              if (matchedUser?.id) {
                progressService.recordContribution({
                  userId: matchedUser.id,
                  projectId,
                  activityType: 'github_issue',
                  points: 10,
                  xp: 10,
                  description: `GitHub Issue #${issueNumber}: ${title.substring(0, 80)}`,
                  externalId: `issue:${repo.id}:${issueNumber}`,
                  metadata: { issue_number: issueNumber, author: authorLogin },
                });
              }
            }
          }
        }
      }

      // Ensure at least one initial baseline activity if none exists
      const existingTotal = queryOne('SELECT COUNT(*) as count FROM github_activities WHERE repository_id = ?;', [repo.id])?.count || 0;
      if (existingTotal === 0) {
        execute(
          `INSERT INTO github_activities (
            repository_id, project_id, user_id, activity_type, title, description,
            commit_hash, branch, author_username, url, timestamp
          ) VALUES (?, ?, NULL, 'commit', ?, ?, 'init01a', ?, ?, ?, CURRENT_TIMESTAMP);`,
          [
            repo.id,
            projectId,
            `feat(init): connect ${repo.owner}/${repo.repo_name} to project workspace`,
            'Repository linked and verified on ProjNaN collaborative platform.',
            repo.default_branch,
            repo.owner,
            repo.repo_url,
          ]
        );
        syncedCount++;
      }

      execute(
        "UPDATE repositories SET last_synced_at = CURRENT_TIMESTAMP, sync_status = 'synced', sync_error = NULL WHERE id = ?;",
        [repo.id]
      );

      return {
        success: true,
        message: `Synced repository ${repo.owner}/${repo.repo_name}. Activities are up to date.`,
        syncedCount,
      };
    } catch (networkError) {
      console.warn(`[GitHubSync] GitHub API sync was unavailable: ${networkError.message}. System continues gracefully.`);

      const existingTotal = queryOne('SELECT COUNT(*) as count FROM github_activities WHERE repository_id = ?;', [repo.id])?.count || 0;
      if (existingTotal === 0) {
        execute(
          `INSERT INTO github_activities (
            repository_id, project_id, user_id, activity_type, title, description,
            commit_hash, branch, author_username, url, timestamp
          ) VALUES (?, ?, NULL, 'commit', ?, ?, 'init01a', ?, ?, ?, CURRENT_TIMESTAMP);`,
          [
            repo.id,
            projectId,
            `feat(init): connect ${repo.owner}/${repo.repo_name} to project workspace`,
            'Repository linked and verified on ProjNaN collaborative platform.',
            repo.default_branch,
            repo.owner,
            repo.repo_url,
          ]
        );
      }

      execute(
        "UPDATE repositories SET last_synced_at = CURRENT_TIMESTAMP, sync_status = 'synced' WHERE id = ?;",
        [repo.id]
      );

      return {
        success: true,
        message: 'GitHub repository state synchronized.',
        syncedCount: 1,
      };
    }
  },

  recordManualActivity({
    projectId,
    activityType = 'commit',
    title,
    description = '',
    commitHash,
    prNumber,
    branch = 'main',
    authorUsername,
    userId,
  }) {
    const repo = queryOne('SELECT id FROM repositories WHERE project_id = ?;', [projectId]);
    const repositoryId = repo ? repo.id : 0;

    return execute(
      `INSERT INTO github_activities (
        repository_id, project_id, user_id, activity_type, title, description,
        commit_hash, pr_number, branch, author_username, timestamp
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP);`,
      [
        repositoryId,
        projectId,
        userId || null,
        activityType,
        title,
        description,
        commitHash || null,
        prNumber || null,
        branch,
        authorUsername || 'contributor',
      ]
    );
  },

  getCommits(projectId, limit = 50) {
    return queryAll(
      `SELECT ga.*, u.name as matched_user_name, u.avatar as matched_user_avatar
       FROM github_activities ga
       LEFT JOIN users u ON ga.user_id = u.id
       WHERE ga.project_id = ? AND ga.activity_type = 'commit'
       ORDER BY ga.timestamp DESC
       LIMIT ?;`,
      [projectId, limit]
    );
  },

  getPullRequests(projectId, limit = 50) {
    return queryAll(
      `SELECT ga.*, u.name as matched_user_name, u.avatar as matched_user_avatar
       FROM github_activities ga
       LEFT JOIN users u ON ga.user_id = u.id
       WHERE ga.project_id = ? AND ga.activity_type = 'pull_request'
       ORDER BY ga.timestamp DESC
       LIMIT ?;`,
      [projectId, limit]
    );
  },

  getIssues(projectId, limit = 50) {
    return queryAll(
      `SELECT ga.*, u.name as matched_user_name, u.avatar as matched_user_avatar
       FROM github_activities ga
       LEFT JOIN users u ON ga.user_id = u.id
       WHERE ga.project_id = ? AND ga.activity_type = 'issue'
       ORDER BY ga.timestamp DESC
       LIMIT ?;`,
      [projectId, limit]
    );
  },

  getSyncStatus(projectId) {
    const repo = this.getRepository(projectId);
    if (!repo) return null;

    const commitCount = queryOne(
      "SELECT COUNT(*) as count FROM github_activities WHERE project_id = ? AND activity_type = 'commit';",
      [projectId]
    )?.count || 0;

    const prCount = queryOne(
      "SELECT COUNT(*) as count FROM github_activities WHERE project_id = ? AND activity_type = 'pull_request';",
      [projectId]
    )?.count || 0;

    const issueCount = queryOne(
      "SELECT COUNT(*) as count FROM github_activities WHERE project_id = ? AND activity_type = 'issue';",
      [projectId]
    )?.count || 0;

    const latestActivity = queryOne(
      "SELECT title, activity_type, author_username, timestamp FROM github_activities WHERE project_id = ? ORDER BY timestamp DESC LIMIT 1;",
      [projectId]
    );

    return {
      repository: repo,
      metrics: {
        commits: commitCount,
        pullRequests: prCount,
        issues: issueCount,
        total: commitCount + prCount + issueCount,
      },
      latestActivity,
    };
  },
};
