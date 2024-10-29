import { execSync } from 'node:child_process';
import { findPublicPackages } from './changelog/find_packages';
import {
  collateChangelogFiles,
  updateChangelog,
  type ChangelogMap,
} from './changelog/update';

const TYPE_MAJOR = 'major';
const TYPE_MINOR = 'minor';
const TYPE_PATCH = 'patch';
const TYPE_BACKPORT = 'backport';
const TYPE_PRERELEASE = 'prerelease';

const getNextRecommendedVersionTypeFromChangelog = (
  changelogMap: ChangelogMap
) => {
  const hasFeatures = changelogMap['Features'].length > 0;
  const hasBugFixes = changelogMap['Bug fixes'].length > 0;
  const hasBreakingChanges = changelogMap['Breaking changes'].length > 0;
  const hasDeprecations = changelogMap['Deprecations'].length > 0;

  if (!hasFeatures && !hasBugFixes && !hasBreakingChanges && !hasDeprecations) {
    return null;
  }

  if (hasBugFixes && !hasFeatures) {
    // there are bug fixes with no minor features
    return TYPE_PATCH;
  }

  if (hasBreakingChanges) {
    // detected breaking changes
    return TYPE_MAJOR;
  }

  return TYPE_MINOR;
};

const getNextVersion = (currentVersion: string, type: string) => {
  // Normal releases
  let [major, minor, patch] = currentVersion.split('.').map(Number);

  // Special releases, e.g. `v1.1.1-backport.0` or `v2.2.2-rc.1`
  const incrementPreId = (preId: string) => {
    const [versionWithoutPreId, affix] = currentVersion.split(`-${preId}`);
    // Releasing from a main release, e.g. `v1.1.1` - add the preId and number automatically
    if (!affix) return `${currentVersion}-${preId}.0`;

    const releaseNumber = Number(affix.split('.')[1]);
    // Edge case for odd formats - coerce to the format we want
    if (isNaN(releaseNumber)) return `${versionWithoutPreId}-${preId}.0`;

    // Otherwise, increment the existing release number
    return `${versionWithoutPreId}-${preId}.${releaseNumber + 1}`;
  };

  switch (type) {
    case 'major':
      major += 1;
      minor = 0;
      patch = 0;
      break;
    case 'minor':
      minor += 1;
      patch = 0;
      break;
    case 'patch':
      patch += 1;
      break;
    case 'backport':
      return incrementPreId('backport');
    case 'prerelease':
      return incrementPreId('rc');
  }

  return [major, minor, patch].join('.');
};

const main = async () => {
  const repoRootDir = process.env.INIT_CWD as string;

  const publicPackages = await findPublicPackages(repoRootDir);
  for (const publicPackage of publicPackages) {
    const { changelogMap, changelog } = collateChangelogFiles({
      packageRootDir: publicPackage.packageRootDir,
    });

    const hasChanges = changelog.length > 0;
    const recommendedVersionType =
      getNextRecommendedVersionTypeFromChangelog(changelogMap);
    const nextVersion = recommendedVersionType
      ? getNextVersion(publicPackage.version, recommendedVersionType)
      : null;

    const summaryStr = Object.entries(changelogMap)
      .map(([key, value]) => `${value.length} ${key}`)
      .join(', ');
    console.log(
      [
        `* [${publicPackage.name}]`,
        hasChanges
          ? `${publicPackage.version} -> ${nextVersion}`
          : 'no changes',
      ].join(' ')
    );
    console.log(`  ${summaryStr}`);

    if (!nextVersion) {
      continue;
    }

    updateChangelog({
      packageRootDir: publicPackage.packageRootDir,
      upcomingChangelog: changelog,
      version: nextVersion,
    });

    execSync(`yarn --cwd ${publicPackage.packageRootDir} version ${nextVersion}`);
  }
};

main();
