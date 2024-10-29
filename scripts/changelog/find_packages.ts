import { dirname } from 'node:path';
import { readFile } from 'node:fs/promises';
import { glob } from 'glob';

interface PackageDetails {
  packageRootDir: string;
  name: string;
  version: string;
}

export const findPublicPackages = async (repoRootDir: string) => {
  const packageJsonFiles = await glob(
    `${repoRootDir}/packages/*/package.json`,
  );

  const publicPackages: PackageDetails[] = [];

  for (const packageJsonFile of packageJsonFiles) {
    const packageJsonStr = await readFile(packageJsonFile, 'utf-8');
    const packageJson = JSON.parse(packageJsonStr);

    if (packageJson.hasOwnProperty('private') && packageJson.private === true) {
      continue;
    }

    publicPackages.push({
      packageRootDir: dirname(packageJsonFile),
      name: packageJson.name,
      version: packageJson.version,
    });
  }

  return publicPackages;
};
