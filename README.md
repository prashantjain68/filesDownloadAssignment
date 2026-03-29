## Stack

React + TypeScript + Webpack + CSS-in-JS + ESLint + Prettier + jest + React Testing Library

## Links

- **Live App (vercel)**: https://files-download-assignment.vercel.app/
- **GitHub**: https://github.com/prashantjain68/filesDownloadAssignment

## Screenshots

A few screenshots are available [here](https://github.com/prashantjain68/filesDownloadAssignment/tree/main/screenshots).

## Code Review

The three primary files to review are:

- `src/components/FilesViewer.tsx` — main component implementing the file listing UI
- `src/components/FilesViewer.test.tsx` — unit tests covering all functionality

- `src/utils/FilesService.ts` mimics an API call and resolves its promise after a 500ms delay.

Code coverage is close to 100% and all functionality is fully unit tested.

Accessibility features have been added to ensure the component is usable with screen readers and keyboard navigation.

Styling is done using CSS-in-JS (via react-jss), with normalize.css used as a baseline reset.

State is managed locally within the component rather than an external store (e.g. Zustand), as the feature is self-contained and involves no prop drilling.

API errors are handled and displayed in the UI. To simulate an error, set `GET_FILES_SHOULD_THROW_ERROR = true` in `src/utils/FilesService.ts`. This error case is fully tested in `FilesViewer.test.tsx`.

## Getting Started

```bash
npm install
npm start        # Dev server at http://localhost:3000
```

## Scripts

```bash
npm start            # Start development server
npm run build        # Production build
npm test             # Run tests
```
