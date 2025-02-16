import { createBrowserRouter } from 'react-router-dom';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    future: {
      v7_startTransition: true,
      v7_relativeSplatPath: true
    }
  }
]);