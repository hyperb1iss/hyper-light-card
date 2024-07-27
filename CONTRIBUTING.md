# 🌟 Contributing to Hyper Light Card

🌠🌠🌠 Let's make beautiful pixels together! 🌠🌠🌠


## 🚀 Getting Started

### Issues and Features

- 🔍 Check our [Issues](https://github.com/hyperb1iss/hyper-light-card/issues) page to see if your idea or bug report is already there.
- 💡 If not, feel free to [create a new issue](https://github.com/hyperb1iss/hyper-light-card/issues/new).

### Forking and Branching

1. 🍴 [Fork the Hyper Light Card repository](https://help.github.com/articles/fork-a-repo).
2. 🌿 Create a branch with a descriptive name:
   ```sh
   git checkout -b add-new-effect-selector
   ```

## 🛠️ Development Environment

### Prerequisites

- 📦 [Node.js](https://nodejs.org/) (we recommend using [nvm](https://github.com/nvm-sh/nvm) for version management)

### Setup

1. Clone your fork:
   ```sh
   git clone https://github.com/YOUR_USERNAME/hyper-light-card.git
   ```
2. Navigate to the project directory:
   ```sh
   cd hyper-light-card
   ```
3. Install dependencies:
   ```sh
   npm install
   ```

## 💻 Development Workflow

We use several npm scripts to streamline development:

- `npm run dev`: Starts the development server and watches for changes.
- `npm run build:dev`: Builds the project in development mode.
- `npm run lint`: Checks code style and identifies issues.
- `npm test`: Runs the test suite.

### Getting Started with Development

1. Ensure your `config.js` file is set up with your Home Assistant configuration path.
2. Start the development server:
   ```sh
   npm run dev
   ```
3. Make your changes to the code.
4. The development server will automatically rebuild and copy files to your Home Assistant config directory.
5. Refresh your Home Assistant dashboard to see your changes.

## ✅ QA

Before submitting your changes:

1. 🧪 Run the test suite:
   ```sh
   npm test
   ```
2. 🔍 Check for style issues:
   ```sh
   npm run lint
   ```
3. 🔧 If there are fixable lint errors, run:
   ```sh
   npm run lint:fix
   ```

## 🏗️ Building for Production

To create a production build:

```sh
npm run build
```

This will generate optimized files in the `dist` directory.

## 🎉 Submitting a Pull Request

1. Sync your fork with the main repository:
   ```sh
   git remote add upstream git@github.com:hyperb1iss/hyper-light-card.git
   git checkout master
   git pull upstream master
   ```
2. Update your feature branch:
   ```sh
   git checkout add-new-effect-selector
   git rebase master
   git push --set-upstream origin add-new-effect-selector
   ```
3. Go to GitHub and [create a Pull Request](https://help.github.com/articles/creating-a-pull-request).

## 🔄 Keeping Your PR Updated

If asked to rebase your PR, update your branch like this:

```sh
git checkout add-new-effect-selector
git pull --rebase upstream master
git push --force-with-lease add-new-effect-selector
```

## 💡 Best Practices

- 📚 Update documentation for user-facing changes.
- ✨ Add tests for new features or bug fixes.
- 🎯 Keep pull requests focused on a single feature or bug fix.

