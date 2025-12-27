import React, { useState, Suspense, lazy } from 'react';
import AdminLayout from '../../components/Admin/Layout/AdminLayout';
import LoadingSpinner from '../../components/Common/LoadingSpinner';

// Lazy Load Admin Tabs
const Dashboard = lazy(() =>
  import('../../components/Admin/Dashboard/Dashboard')
);
const Users = lazy(() => import('../../components/Admin/Users/Users'));
const Posts = lazy(() => import('../../components/Admin/Content/Posts'));
const Comments = lazy(() => import('../../components/Admin/Content/Comments'));
const Reports = lazy(() => import('../../components/Admin/Content/Reports'));
const Interactions = lazy(() =>
  import('../../components/Admin/Content/Interactions')
);
const BannedAccounts = lazy(() =>
  import('../../components/Admin/Users/BannedAccounts')
);
const Logs = lazy(() => import('../../components/Admin/System/Logs'));
const Settings = lazy(() => import('../../components/Admin/System/Settings'));
const Revenue = lazy(() => import('../../components/Admin/System/Revenue'));
const SystemHealth = lazy(() =>
  import('../../components/Admin/System/SystemHealth')
);
const Broadcast = lazy(() => import('../../components/Admin/System/Broadcast'));

const AdminPage = () => {
  const [activePage, setActivePage] = useState('dashboard');

  const renderContent = () => {
    switch (activePage) {
      case 'dashboard':
        return <Dashboard />;
      case 'users':
        return <Users />;
      case 'posts':
        return <Posts />;
      case 'comments':
        return <Comments />;
      case 'reports':
        return <Reports />;
      case 'interactions':
        return <Interactions />;
      case 'banned':
        return <BannedAccounts />;
      case 'revenue':
        return <Revenue />;
      case 'broadcast':
        return <Broadcast />;
      case 'systemhealth':
        return <SystemHealth />;
      case 'settings':
        return <Settings />;
      case 'adminlogs':
        return <Logs />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <AdminLayout activePage={activePage} setActivePage={setActivePage}>
      <Suspense
        fallback={
          <div className="flex items-center justify-center h-full min-h-[400px]">
            <LoadingSpinner />
          </div>
        }
      >
        {renderContent()}
      </Suspense>
    </AdminLayout>
  );
};

export default AdminPage;
