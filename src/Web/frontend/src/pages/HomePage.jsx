import React, { Suspense } from 'react';
import BoardListView from '~/pages/Boards';

// Lazy load AppBar để tách bundle riêng
const LazyAppBar = React.lazy(() => import('~/components/AppBar/AppBar'));

export default function HomePage() {
  return (
    <>
      <Suspense fallback={null}>
        <LazyAppBar />
      </Suspense>
      <BoardListView />
    </>
  );
}