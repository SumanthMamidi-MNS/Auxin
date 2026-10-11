# Contributing to Auxin

Thank you for your interest in contributing to Auxin! As an open-source project, we welcome improvements, bug fixes, and suggestions.

---

## Code of Conduct
By participating in this project, you agree to abide by our [Code of Conduct](CODE_OF_CONDUCT.md).

## Getting Started
1. **Fork the Repository**: Create a fork of the Auxin repository under your GitHub account.
2. **Clone Locally**: Clone your fork to your local machine.
3. **Setup Environment**:
   - Set up the Python virtual environment (`python -m venv venv` and `pip install -r requirements.txt`).
   - Run Next.js portal builds in `auxin-frontend` and `auxin-admin` (`npm install`).
4. **Run Tests**: Verify your setup passes the existing tests using `pytest`.

## Coding Guidelines
- **Python**: Enforce PEP 8 style formatting. Run pytest to check code correctness.
- **TypeScript & Next.js**: Ensure TypeScript compilations compile without errors before submitting.
- **Branding**: Do not alter default Auxin design tokens unless raising accessibility compliance.

## Submitting Pull Requests
1. Create a descriptive branch (e.g. `feat/milo-openai-provider`).
2. Make code edits and add accompanying test cases.
3. Push to your fork and raise a Pull Request targeting the `main` branch.
