#!/usr/bin/env python3

import os
import re
import subprocess
import sys
from datetime import datetime

import json
import semver
from github import Github

# Configuration
REPO_NAME = "hyperb1iss/hyper-light-card"
MAIN_FILE = "src/hyper-light-card.ts"
CHANGELOG_FILE = "CHANGELOG.md"
HACS_MANIFEST = "hacs.json"


def get_current_version():
    with open("package.json", "r") as file:
        package_json = json.load(file)
        return package_json.get("version")


def update_version(new_version):
    with open("package.json", "r+") as file:
        package_json = json.load(file)
        package_json["version"] = new_version
        file.seek(0)
        json.dump(package_json, file, indent=2)
        file.truncate()


def commit_and_push(version):
    subprocess.run(["git", "add", MAIN_FILE, CHANGELOG_FILE, HACS_MANIFEST])
    subprocess.run(["git", "commit", "-m", f":bookmark: Bump version to {version}"])
    subprocess.run(["git", "push"])
    subprocess.run(["git", "tag", f"v{version}"])
    subprocess.run(["git", "push", "--tags"])


def create_github_release(version, changelog_entry):
    g = Github(os.environ.get("GITHUB_TOKEN"))
    repo = g.get_repo(REPO_NAME)
    repo.create_git_release(
        f"v{version}",
        f"Release {version}",
        changelog_entry,
        draft=False,
        prerelease=False,
    )


def main():
    current_version = get_current_version()
    if not current_version:
        print("Error: Couldn't find current version.")
        sys.exit(1)

    print(f"Current version: {current_version}")
    new_version = input("Enter new version: ")

    try:
        semver.parse(new_version)
    except ValueError:
        print("Error: Invalid semantic version.")
        sys.exit(1)

    update_version(new_version)

    print(
        "Changes made. Please review and press Enter to commit and push, or Ctrl+C to abort."
    )
    input()

    commit_and_push(new_version)

    create_github_release(new_version, changelog_entry)

    print(f"Version {new_version} has been released!")


if __name__ == "__main__":
    main()
