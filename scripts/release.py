#!/usr/bin/env python3
""" Release management for hyper-light-card """

# ruff: noqa: E501
# pylint: disable=broad-exception-caught

import json
import re
import subprocess
import sys
from typing import List, Optional, Tuple

import semver
from colorama import Style, init
from wcwidth import wcswidth

# Initialize colorama
init(autoreset=True)

# Configuration
REPO_NAME = "hyperb1iss/hyper-light-card"
FILE = "hyper-light-card.js"
DIST = "dist/" + FILE
TARGET = "target/" + FILE
HACS_MANIFEST = "hacs.json"
PACKAGE_JSON = "package.json"

# ANSI Color Constants
COLOR_RESET = Style.RESET_ALL
COLOR_BORDER = "\033[38;2;75;0;130m"
COLOR_STAR = "\033[38;2;255;255;0m"
COLOR_ERROR = "\033[38;2;255;0;0m"
COLOR_SUCCESS = "\033[38;2;50;205;50m"
COLOR_BUILD_SUCCESS = "\033[38;2;255;215;0m"
COLOR_VERSION_PROMPT = "\033[38;2;147;112;219m"
COLOR_STEP = "\033[38;2;255;0;130m"

# Gradient colors for the banner
GRADIENT_COLORS = [
    (255, 0, 255),
    (255, 0, 255),
    (0, 0, 255),
    (0, 255, 0),
    (0, 0, 255),
    (255, 0, 255),
]


# Functions for printing colored text
def print_colored(message: str, color: str) -> None:
    """Print a message with a specific color.

    Args:
        message (str): The message to print.
        color (str): The ANSI color code to apply to the message.
    """
    print(f"{color}{message}{COLOR_RESET}")


def print_step(step: str) -> None:
    """Print a step in the process with a specific color.

    Args:
        step (str): The step description to print.
    """
    print_colored(f"\n✨ {step}", COLOR_STEP)


def print_error(message: str) -> None:
    """Print an error message with a specific color.

    Args:
        message (str): The error message to print.
    """
    print_colored(f"❌ Error: {message}", COLOR_ERROR)


def print_success(message: str) -> None:
    """Print a success message with a specific color.

    Args:
        message (str): The success message to print.
    """
    print_colored(message, COLOR_SUCCESS)


def generate_gradient(colors: List[Tuple[int, int, int]], steps: int) -> List[str]:
    """Generate a list of color codes for a smooth multi-color gradient.

    Args:
        colors (List[Tuple[int, int, int]]): List of RGB tuples defining the gradient colors.
        steps (int): Number of steps in the gradient.

    Returns:
        List[str]: A list of ANSI color codes representing the gradient.
    """
    gradient = []
    segments = len(colors) - 1
    steps_per_segment = max(1, steps // segments)

    for i in range(segments):
        start_color = colors[i]
        end_color = colors[i + 1]
        for j in range(steps_per_segment):
            t = j / steps_per_segment
            r = int(start_color[0] * (1 - t) + end_color[0] * t)
            g = int(start_color[1] * (1 - t) + end_color[1] * t)
            b = int(start_color[2] * (1 - t) + end_color[2] * t)
            gradient.append(f"\033[38;2;{r};{g};{b}m")

    return gradient


def strip_ansi(text: str) -> str:
    """Remove ANSI color codes from a string.

    Args:
        text (str): The string containing ANSI color codes.

    Returns:
        str: The string with ANSI color codes removed.
    """
    ansi_escape = re.compile(r"\x1B[@-_][0-?]*[ -/]*[@-~]")
    return ansi_escape.sub("", text)


def apply_gradient(text: str, gradient: List[str], line_number: int) -> str:
    """Apply gradient colors diagonally to text.

    Args:
        text (str): The text to color.
        gradient (List[str]): The list of gradient color codes.
        line_number (int): The current line number in the block of text.

    Returns:
        str: The text with diagonal gradient colors applied.
    """
    return "".join(
        f"{gradient[(i + line_number) % len(gradient)]}{char}"
        for i, char in enumerate(text)
    )


def center_text(text: str, width: int) -> str:
    """Center text, accounting for ANSI color codes and Unicode widths.

    Args:
        text (str): The text to center.
        width (int): The width of the line to center within.

    Returns:
        str: The centered text.
    """
    visible_length = wcswidth(strip_ansi(text))
    padding = (width - visible_length) // 2
    return f"{' ' * padding}{text}{' ' * (width - padding - visible_length)}"


def center_block(block: List[str], width: int) -> List[str]:
    """Center a block of text within a given width.

    Args:
        block (List[str]): The list of text lines to center.
        width (int): The width of the line to center within.

    Returns:
        List[str]: The list of centered text lines.
    """
    return [center_text(line, width) for line in block]


def create_banner() -> str:
    """Create a beautiful cosmic-themed banner with diagonal gradient.

    Returns:
        str: The generated banner as a string.
    """
    banner_width = 60
    content_width = banner_width - 4  # Accounting for border characters
    cosmic_gradient = generate_gradient(GRADIENT_COLORS, banner_width)

    logo = [
        "██╗  ██╗██╗   ██╗██████╗ ███████╗██████╗ ",
        "██║  ██║╚██╗ ██╔╝██╔══██╗██╔════╝██╔══██╗",
        "███████║ ╚████╔╝ ██████╔╝█████╗  ██████╔╝",
        "██╔══██║  ╚██╔╝  ██╔═══╝ ██╔══╝  ██╔══██╗",
        "██║  ██║   ██║   ██║     ███████╗██║  ██║",
        "╚═╝  ╚═╝   ╚═╝   ╚═╝     ╚══════╝╚═╝  ╚═╝",
        "    ██╗     ██╗ ██████╗ ██╗  ██╗████████╗",
        "    ██║     ██║██╔════╝ ██║  ██║╚══██╔══╝",
        "    ██║     ██║██║  ███╗███████║   ██║   ",
        "    ██║     ██║██║   ██║██╔══██║   ██║   ",
        "    ███████╗██║╚██████╔╝██║  ██║   ██║   ",
        "    ╚══════╝╚═╝ ╚═════╝ ╚═╝  ╚═╝   ╚═╝   ",
        "          ██████╗ █████╗ ██████╗ ██████╗ ",
        "         ██╔════╝██╔══██╗██╔══██╗██╔══██╗",
        "         ██║     ███████║██████╔╝██║  ██║",
        "         ██║     ██╔══██║██╔══██╗██║  ██║",
        "         ╚██████╗██║  ██║██║  ██║██████╔╝",
        "          ╚═════╝╚═╝  ╚═╝╚═╝  ╚═╝╚═════╝ ",
    ]

    centered_logo = center_block(logo, content_width)

    banner = [
        center_text(
            f"{COLOR_STAR}･ ｡ ☆ ∴｡　　･ﾟ*｡★･ ∴｡　　･ﾟ*｡☆ ･ ｡ ☆ ∴｡", banner_width
        ),
        f"{COLOR_BORDER}╭{'─' * (banner_width - 4)}╮",
    ]

    for line_number, line in enumerate(centered_logo):
        gradient_line = apply_gradient(line, cosmic_gradient, line_number)
        banner.append(f"{COLOR_BORDER}│{gradient_line}{COLOR_BORDER}│")

    # Apply gradient to "Release Manager"
    release_manager_text = COLOR_STEP + "Release Manager"

    banner.extend(
        [
            f"{COLOR_BORDER}╰{'─' * (banner_width - 4)}╯",
            center_text(
                f"{COLOR_STAR}∴｡　　･ﾟ*｡☆ {release_manager_text}{COLOR_STAR} ☆｡*ﾟ･　 ｡∴",
                banner_width,
            ),
            center_text(
                f"{COLOR_STAR}･ ｡ ☆ ∴｡　　･ﾟ*｡★･ ∴｡　　･ﾟ*｡☆ ･ ｡ ☆ ∴｡", banner_width
            ),
        ]
    )

    return "\n".join(banner)


def print_logo() -> None:
    """Print the banner/logo for the release manager."""
    print(create_banner())


def get_current_version() -> Optional[str]:
    """Retrieve the current version from package.json.

    Returns:
        Optional[str]: The current version as a string, or None if not found.
    """
    try:
        with open(PACKAGE_JSON, "r", encoding="utf-8") as file:
            package_json = json.load(file)
            return package_json.get("version")
    except (FileNotFoundError, json.JSONDecodeError) as e:
        print_error(f"Error reading {PACKAGE_JSON}: {e}")
        sys.exit(1)


def update_version(new_version: str) -> None:
    """Update the version in package.json.

    Args:
        new_version (str): The new version to set.
    """
    try:
        with open(PACKAGE_JSON, "r+", encoding="utf-8") as file:
            package_json = json.load(file)
            package_json["version"] = new_version
            file.seek(0)
            json.dump(package_json, file, indent=2)
            file.truncate()
        print_success(f"✅ Updated version in package.json to {new_version}")
    except Exception as e:
        print_error(f"Failed to update version: {str(e)}")
        sys.exit(1)


def build() -> None:
    """Run the build process using npm."""
    print_step("Rebuilding")
    try:
        subprocess.run(["npm", "run", "build"], check=True)
        print_colored("✅ Build completed successfully", COLOR_BUILD_SUCCESS)
    except subprocess.CalledProcessError as e:
        print_error(f"Build process failed: {str(e)}")
        sys.exit(1)


def commit_and_push(version: str) -> None:
    """Commit the changes and push them to the repository.

    Args:
        version (str): The version to tag the commit with.
    """
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
        print_success(f"✅ Changes committed and pushed for version {version}")
    except subprocess.CalledProcessError as e:
        print_error(f"Git operations failed: {str(e)}")
        sys.exit(1)


def main() -> None:
    """Main function to run the release process."""
    print_logo()
    print_step("Starting release process")

    current_version = get_current_version()
    if not current_version:
        print_error("Couldn't find current version.")
        sys.exit(1)

    print_colored(f"Current version: {current_version}", COLOR_STEP)
    new_version = input(COLOR_VERSION_PROMPT + "Enter new version: " + COLOR_RESET)

    try:
        semver.parse(new_version)
    except ValueError:
        print_error("Invalid semantic version.")
        sys.exit(1)

    update_version(new_version)

    build()

    print_colored(
        "\n✨ Changes made. Please review and press Enter to commit and push, or Ctrl+C to abort.",
        COLOR_VERSION_PROMPT,
    )
    input()

    commit_and_push(new_version)

    print_success(
        f"\n🎉✨ hyper-light-card v{new_version} has been successfully released! ✨🎉"
    )


if __name__ == "__main__":
    main()
