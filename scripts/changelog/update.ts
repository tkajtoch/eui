/**
 * This script collates all files in the `changelogs/upcoming/` directory
 * into the latest year's changelog file under the latest release version
 */

import * as path from 'node:path';
import * as fs from 'node:fs';
import * as glob from 'glob';
import { rimraf } from 'rimraf';
import { execSync } from 'child_process';

export interface CollateChangelogFilesOptions {
  packageRootDir: string;
}

export interface ChangelogMap {
  Features: string[];
  'Bug fixes': string[];
  Deprecations: string[];
  'Breaking changes': string[];
}

/**
 * Convert individual changelog files into a single changelog string
 */
export const collateChangelogFiles = ({
  packageRootDir,
}: CollateChangelogFilesOptions) => {
  const upcomingChangelogsDir = path.resolve(
    packageRootDir,
    'changelogs/upcoming'
  );
  const upcomingChangelogFiles = glob.sync(
    path.join(upcomingChangelogsDir, '**.md'),
    {
      realpath: true,
      ignore: [path.join(upcomingChangelogsDir, '_template.md')],
    }
  );

  /**
   * Iterate through each changelog file, split it out by subheadings,
   * and then append each subheading type to the changelog map
   */
  const upcomingChangelogMap: ChangelogMap = {
    Features: [], // No heading, top of the changelog
    'Bug fixes': [],
    Deprecations: [],
    'Breaking changes': [],
  };

  upcomingChangelogFiles.forEach((filePath) => {
    // Automatically generate the pull request link based on the filename
    const pullRequestId = path.basename(filePath, '.md');
    const pullRequestLink = `([#${pullRequestId}](https://github.com/elastic/eui/pull/${pullRequestId}))`;

    const changelog = fs.readFileSync(filePath).toString();
    const sections = changelog.split(/\r?\n\*\*/);
    sections.forEach((section) => {
      let heading = '';
      let text = '';

      const hasHeading = section.match(/\*\*\r?\n/);
      if (hasHeading) {
        [heading, text] = section.split(/\*\*\r?\n/);
      } else {
        text = section;
      }
      // Cleanup
      heading = heading.replace('**', '').trim();
      text = text.trim();

      if (text) {
        // Split changelog text into discrete log items (if there are multiple) and append a PR link for each
        let items = text.split(/\r?\n/).map((item) =>
          // Skip indented changelog items - they're presumably a child item providing more info, and don't need individual links
          item.startsWith('  -') ? item : `${item} ${pullRequestLink}`
        );

        if (!heading) {
          // No heading, so must be new features/enhancements only
          upcomingChangelogMap['Features'].push(...items);
        } else {
          // If this is a custom heading, create the heading key
          if (!upcomingChangelogMap.hasOwnProperty(heading)) {
            upcomingChangelogMap[heading as keyof ChangelogMap] = [];
          }
          upcomingChangelogMap[heading as keyof ChangelogMap].push(...items);
        }
      }
    });
  });

  /**
   * Combine the changelog map into text
   */
  let upcomingChangelog = '';
  let changelogSections: string[] = [];

  Object.entries(upcomingChangelogMap).forEach(([section, items]) => {
    if (!items.length) return; // Nothing to add

    let changelog = '';
    if (section !== 'Features') changelog += `**${section}**\n\n`;
    changelog += items.join('\n');

    changelogSections.push(changelog);
  });
  upcomingChangelog = changelogSections.join('\n\n');

  return { changelogMap: upcomingChangelogMap, changelog: upcomingChangelog };
};

export interface UpdateChangelogOptions {
  packageRootDir: string;
  upcomingChangelog: string;
  version: string;
  yearsFilePath?: string;
}

/**
 * Write to latest year's changelog file, delete individual upcoming changelog files, & stage changes
 */
export const updateChangelog = ({
  upcomingChangelog,
  version,
  packageRootDir,
  yearsFilePath,
}: UpdateChangelogOptions) => {
  if (!upcomingChangelog) {
    throw new Error('Cannot update changelog - no changes found');
  }

  const changelogDir = path.join(packageRootDir, 'changelogs');

  const year = new Date().getUTCFullYear();
  const pathToChangelog = path.resolve(changelogDir, `CHANGELOG_${year}.md`);

  if (yearsFilePath) {
    updateChangelogYears({
      year,
      yearsFilePath,
    });
  }

  let changelogArchive = '';
  try {
    changelogArchive = fs.readFileSync(pathToChangelog).toString();
  } catch {}

  let latestVersionHeading = `## [\`v${version}\`](https://github.com/elastic/eui/releases/v${version})`;
  if (version.includes('-backport')) {
    latestVersionHeading +=
      '\n\n**This is a backport release only intended for use by Kibana.**';
  } else if (version.includes('-rc')) {
    latestVersionHeading +=
      '\n\n**This is a prerelease candidate not intended for public use.**';
  }

  if (changelogArchive.startsWith(latestVersionHeading)) {
    throw new Error('Cannot update changelog - already on latest version');
  }

  const updatedChangelog = `${latestVersionHeading}\n\n${upcomingChangelog}\n\n${changelogArchive}`;
  fs.writeFileSync(pathToChangelog, updatedChangelog);

  // Delete upcoming changelogs
  rimraf.sync(path.join(changelogDir, 'upcoming/!(_template).md'), {
    glob: true,
  });
};

interface UpdateChangelogYearsOptions {
  year: number;
  yearsFilePath: string;
}

/**
 * Automatically update the docs' site array of changelog years
 * whenever a new year changelog file is added
 */
export const updateChangelogYears = ({
  year,
  yearsFilePath,
}: UpdateChangelogYearsOptions) => {
  const { years } = JSON.parse(fs.readFileSync(yearsFilePath).toString());

  if (!years.includes(year)) {
    years.unshift(year);
    fs.writeFileSync(yearsFilePath, JSON.stringify({ years }, null, 2));
  }
};
