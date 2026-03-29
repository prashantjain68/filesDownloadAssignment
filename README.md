## Code Review

The two primary files to review are:

- `src/components/FilesViewer.tsx` — main component implementing the file listing UI
- `src/components/FilesViewer.test.tsx` — unit tests covering all functionality

`src/utils/FilesService.ts` mimics an API call and resolves its promise after a 500ms delay.

Code coverage is close to 100% and all functionality is fully unit tested.

## Getting Started

```bash
npm install
npm start        # Dev server at http://localhost:3000
```

## Scripts

```bash
npm start            # Start development server
npm run build        # Production build
npm run build:dev    # Development build
npm test             # Run tests
npm run test:watch   # Watch mode
npm run test:coverage # Coverage report
npm run lint         # Lint source files
npm run lint:fix     # Auto-fix lint errors
npm run format       # Format with Prettier
npm run type-check   # TypeScript type check only
```
