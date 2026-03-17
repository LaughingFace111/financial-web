import { lazy, Suspense } from 'react';
import { Navigate, createBrowserRouter } from 'react-router-dom';
import { getSession } from './auth/session';

const LoginPage = lazy(() => import('./pages/LoginPage'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const ImportPage = lazy(() => import('./pages/ImportPage'));

function withSuspense(node: JSX.Element) {
  return <Suspense fallback={<div className='p-4'>Loading...</div>}>{node}</Suspense>;
}

async function guard(roles?: string[]) {
  const session = await getSession();
  if (!session) throw new Response('', { status: 302, headers: { Location: '/login' } });
  if (roles && !roles.includes(session.role)) throw new Response('', { status: 302, headers: { Location: '/' } });
  return session;
}

export const router = createBrowserRouter([
  { path: '/login', element: withSuspense(<LoginPage />) },
  { path: '/', loader: () => guard(), element: withSuspense(<DashboardPage />) },
  { path: '/import', loader: () => guard(['user', 'admin']), element: withSuspense(<ImportPage />) },
  { path: '*', element: <Navigate to='/' replace /> }
]);
