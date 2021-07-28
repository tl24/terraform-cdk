import * as path from "path";
import * as semver from "semver";
import { Errors } from "../../../lib/errors";
import { exec } from "../../../lib/util";

function throwIfLowerVersion(
  command: string,
  language: string,
  minVersion: string,
  stdout: string
) {
  const version = semver.coerce(stdout);
  if (!version || !semver.valid(version)) {
    console.error(
      Errors.Internal(
        command,
        `Unable to parse ${language} version "${stdout}"`
      )
    );
    return;
  }

  if (semver.lt(version, minVersion)) {
    console.error(
      Errors.Usage(
        command,
        `${language} version "${version}" is not supported. Please upgrade to at least ${minVersion}`
      )
    );
  }
}

function getBinaryVersion(
  command: string,
  binary: string,
  versionCommand: string
): Promise<string> {
  try {
    return exec(binary, [versionCommand], {});
  } catch (e) {
    throw Errors.Usage(
      command,
      `Unable to run ${binary} ${versionCommand}, please check if ${binary} is installed: ${e}`
    );
  }
}

async function checkGoVersion(command: string) {
  const out = await getBinaryVersion(command, "go", "version");
  throwIfLowerVersion(command, "Go", "1.16.0", out);
}

async function checkNodeVersion(command: string) {
  const out = await getBinaryVersion(command, "node", "--version");
  throwIfLowerVersion(command, "Node.js", "12.16.0", out);
}

export async function checkEnvironment(
  command: string,
  projectPath = process.cwd()
) {
  let cdktfJson: { language: string };
  try {
    cdktfJson = require(path.resolve(projectPath, "cdktf.json"));
  } catch (e) {
    throw Errors.Usage(
      command,
      `Could not find cdktf.json in "${projectPath}": ${e}`
    );
  }

  switch (cdktfJson.language) {
    case "go":
      await checkGoVersion(command);
  }
  await checkNodeVersion(command);
}
