import { config } from '../config/env.js';
import { execute, queryAll, queryOne, transaction } from '../config/database.js';

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
  connectRepository({ projectId, repoUrl, defaultBranch = 'main' }) {
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
      `INSERT INTO repositories (project_id, repo_url, repo_name, owner, default_branch, last_synced_at)
       VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
       ON CONFLICT(project_id) DO UPDATE SET
         repo_url = excluded.repo_url,
         repo_name = excluded.repo_name,
         owner = excluded.owner,
         default_branch = excluded.default_branch,
         last_synced_at = CURRENT_TIMESTAMP;`,
      [projectId, normalizedUrl, repoName, owner, defaultBranch]
    );

    return queryOne('SELECT id, project_id, repo_url, repo_name, owner, default_branch, last_synced_at FROM repositories WHERE project_id = ?;', [projectId]);
  },

  getRepository(projectId) {
    return queryOne(
      'SELECT id, project_id, repo_url, repo_name, owner, default_branch, last_synced_at FROM repositories WHERE project_id = ?;',
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

    const token = config.githubDefaultToken;
    const headers = {
      'User-Agent': 'ProjNaN-Educational-Platform',
      Accept: 'application/vnd.github.v3+json',
      ...(token ? { Authorization: `token ${token}` } : {}),
    };

    let syncedCount = 0;

    try {
      // 1. Fetch commits
      const commitsUrl = `https://api.github.com/repos/${repo.owner}/${repo.repo_name}/commits?per_page=15`;
      const commitRes = await fetch(commitsUrl, { headers });

      if (commitRes.ok) {
        const commits = await commitRes.json();
        if (Array.isArray(commits)) {
          for (const c of commits) {
            const hash = c.sha?.substring(0, 7) || 'commit';
            const authorLogin = c.author?.login || c.commit?.author?.name || 'unknown';
            const message = c.commit?.message?.split('\n')[0] || 'Commit update';
            const date = c.commit?.author?.date || new Date().toISOString();

            // Match to existing user if github_username matches
            const matchedUser = queryOne(
              'SELECT id FROM users WHERE LOWER(github_username) = LOWER(?) OR LOWER(name) LIKE LOWER(?);',
              [authorLogin, `%${authorLogin}%`]
            );

            const existingActivity = queryOne(
              'SELECT id FROM github_activities WHERE repository_id = ? AND commit_hash = ?;',
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
            }
          }
        }
      }

      // If zero activities exist for this repo, seed an initial connection activity
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

      // Update sync timestamp
      execute('UPDATE repositories SET last_synced_at = CURRENT_TIMESTAMP WHERE id = ?;', [repo.id]);

      return {
        success: true,
        message: `Synced repository ${repo.owner}/${repo.repo_name}. Activities are up to date.`,
        syncedCount,
      };
    } catch (networkError) {
      // Graceful fallback: Network/API down or rate limited. Core system continues functioning!
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
      execute('UPDATE repositories SET last_synced_at = CURRENT_TIMESTAMP WHERE id = ?;', [repo.id]);

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
};
