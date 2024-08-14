#!/usr/bin/env python3
""" Release management for hyper-light-card """

import json
import subprocess
import sys

import semver
from colorama import Fore, Style, init

# Initialize colorama
init(autoreset=True)

# Colorful ASCII Art Banner
LOGO = f"""
{Fore.CYAN}     ･ ｡ ☆ ∴｡　　･ﾟ*｡★･ ∴｡　　･ﾟ*｡☆ ･ ｡ ☆ ∴｡　　
{Fore.YELLOW} ╭──────────────────────────────────────────────╮
{Fore.MAGENTA} │   ██╗  ██╗██╗   ██╗██████╗ ███████╗██████╗   │
{Fore.MAGENTA} │   ██║  ██║╚██╗ ██╔╝██╔══██╗██╔════╝██╔══██╗  │
{Fore.MAGENTA} │   ███████║ ╚████╔╝ ██████╔╝█████╗  ██████╔╝  │
{Fore.MAGENTA} │   ██╔══██║  ╚██╔╝  ██╔═══╝ ██╔══╝  ██╔══██╗  │
{Fore.MAGENTA} │   ██║  ██║   ██║   ██║     ███████╗██║  ██║  │
{Fore.MAGENTA} │   ╚═╝  ╚═╝   ╚═╝   ╚═╝     ╚══════╝╚═╝  ╚═╝  │
{Fore.CYAN} │        ██╗     ██╗ ██████╗ ██╗  ██╗████████╗ │
{Fore.CYAN} │        ██║     ██║██╔════╝ ██║  ██║╚══██╔══╝ │
{Fore.CYAN} │        ██║     ██║██║  ███╗███████║   ██║    │
{Fore.CYAN} │        ██║     ██║██║   ██║██╔══██║   ██║    │
{Fore.CYAN} │        ███████╗██║╚██████╔╝██║  ██║   ██║    │
{Fore.CYAN} │        ╚══════╝╚═╝ ╚═════╝ ╚═╝  ╚═╝   ╚═╝    │
{Fore.GREEN} │             ██████╗ █████╗ ██████╗ ██████╗   │
{Fore.GREEN} │            ██╔════╝██╔══██╗██╔══██╗██╔══██╗  │
{Fore.GREEN} │            ██║     ███████║██████╔╝██║  ██║  │
{Fore.GREEN} │            ██║     ██╔══██║██╔══██╗██║  ██║  │
{Fore.GREEN} │            ╚██████╗██║  ██║██║  ██║██████╔╝  │
{Fore.GREEN} │             ╚═════╝╚═╝  ╚═╝╚═╝  ╚═╝╚═════╝   │
{Fore.YELLOW} ╰──────────────────────────────────────────────╯
{Fore.CYAN}     ∴｡　　･ﾟ*｡☆ Release Manager ☆｡*ﾟ･　 ｡∴
{Fore.YELLOW}     ･ ｡ ☆ ∴｡　　･ﾟ*｡★･ ∴｡　　･ﾟ*｡☆ ･ ｡ ☆ ∴｡　　
"""

# Configuration
REPO_NAME = "hyperb1iss/hyper-light-card"
FILE = "hyper-light-card.js"
DIST = "dist/" + FILE
TARGET = "target/" + FILE
HACS_MANIFEST = "hacs.json"
PACKAGE_JSON = "package.json"

def print_logo():
    print(LOGO)


def print_step(step):
    print(Fore.BLUE + f"\n✨ {step}" + Style.RESET_ALL)


def print_error(message):
    print(Fore.RED + f"❌ Error: {message}" + Style.RESET_ALL)


def get_current_version():
    try:
        with open(PACKAGE_JSON, "r") as file:
            package_json = json.load(file)
            return package_json.get("version")
    except FileNotFoundError:
        print_error("package.json not found.")
        sys.exit(1)
    except json.JSONDecodeError:
        print_error("Invalid JSON in package.json.")
        sys.exit(1)


def update_version(new_version):
    try:
        with open(PACKAGE_JSON, "r+") as file:
            package_json = json.load(file)
            package_json["version"] = new_version
            file.seek(0)
            json.dump(package_json, file, indent=2)
            file.truncate()
        print(
            Fore.YELLOW
            + f"✅ Updated version in package.json to {new_version}"
            + Style.RESET_ALL
        )
    except Exception as e:
        print_error(f"Failed to update version: {str(e)}")
        sys.exit(1)


def build():
    print_step("Rebuilding")
    try:
        subprocess.run(["npm", "run", "build"], check=True)
        print(Fore.YELLOW + "✅ Build completed successfully" + Style.RESET_ALL)
    except subprocess.CalledProcessError as e:
        print_error(f"Build process failed: {str(e)}")
        sys.exit(1)


def commit_and_push(version):
    print_step("Committing and pushing changes")
    try:
        subprocess.run(["cp", "-f", TARGET, DIST], check=True)
        subprocess.run(["git", "add", DIST, HACS_MANIFEST, PACKAGE_JSON], check=True)
        subprocess.run(
            ["git", "commit", "-m", f":rocket: Release version {version}"], check=True
        )
        subprocess.run(["git", "push"], check=True)
        subprocess.run(["git", "tag", f"v{version}"], check=True)
        subprocess.run(["git", "push", "--tags"], check=True)
        print(
            Fore.YELLOW
            + f"✅ Changes committed and pushed for version {version}"
            + Style.RESET_ALL
        )
    except subprocess.CalledProcessError as e:
        print_error(f"Git operations failed: {str(e)}")
        sys.exit(1)


def main():
    print_logo()
    print_step("Starting release process")

    current_version = get_current_version()
    if not current_version:
        print_error("Couldn't find current version.")
        sys.exit(1)

    print(Fore.CYAN + f"Current version: {current_version}" + Style.RESET_ALL)
    new_version = input(Fore.MAGENTA + "Enter new version: " + Style.RESET_ALL)

    try:
        semver.parse(new_version)
    except ValueError:
        print_error("Invalid semantic version.")
        sys.exit(1)

    update_version(new_version)

    build()

    print(
        Fore.MAGENTA
        + "\n✨ Changes made. Please review and press Enter to commit and push, or Ctrl+C to abort."
        + Style.RESET_ALL
    )
    input()

    commit_and_push(new_version)

    print(
        Fore.GREEN
        + f"\n🎉✨ hyper-light-card v{new_version} has been successfully released! ✨🎉"
        + Style.RESET_ALL
    )


if __name__ == "__main__":
    main()
