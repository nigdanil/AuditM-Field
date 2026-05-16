import { RouterProvider } from 'react-router';

import { router } from './app/routes';
import { LegacyUiLocalizer } from './shared/i18n/LegacyUiLocalizer';

export default function App() {
  return (
    <>
      <RouterProvider router={router} />
      <LegacyUiLocalizer />
    </>
  );
}
