import { useState, Suspense, lazy } from 'react';
import AdminLayout from '@/components/Admin/Layout/AdminLayout';
import LoadingSpinner from '@/components/Common/LoadingSpinner';

// Lazy Load Admin Tabs
const Dashboard = lazy(() =>
  import('../../components/Admin/Dashboard/Dashboard')
);
const Users = lazy(() => import('../../components/Admin/Users/Users'));
const Posts = lazy(() => import('../../components/Admin/Content/Posts/Posts'));
const Comments = lazy(() =>
  import('../../components/Admin/Content/Comments/Comments')
);
const Reports = lazy(() =>
  import('../../components/Admin/Content/Reports/Reports')
);
const Interactions = lazy(() =>
  import('../../components/Admin/Content/Interactions/Interactions')
);
const BannedAccounts = lazy(() =>
  import('../../components/Admin/Users/BannedAccounts')
);

const SystemHealth = lazy(() =>
  import('../../components/Admin/System/SystemHealth')
);
const Broadcast = lazy(() => import('../../components/Admin/System/Broadcast'));

const AdminPage = () => {
  const [activePage, setActivePage] = useState('dashboard');

  const pages = {
    dashboard: Dashboard,
    users: Users,
    posts: Posts,
    comments: Comments,
    reports: Reports,
    interactions: Interactions,
    banned: BannedAccounts,
    broadcast: Broadcast,
    systemhealth: SystemHealth,
  };

  const ActivePage = pages[activePage] ?? Dashboard;

  return (
    <AdminLayout activePage={activePage} setActivePage={setActivePage}>
      <Suspense
        fallback={
          <div className="flex items-center justify-center h-full min-h-[400px]">
            <LoadingSpinner />
          </div>
        }
      >
        <ActivePage />
      </Suspense>
    </AdminLayout>
  );
};

export default AdminPage;
