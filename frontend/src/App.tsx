import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Theme } from '@radix-ui/themes';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Layout } from './components/Layout';
import { Register } from './pages/Register';
import { Home } from './pages/Home';
import { Settings } from './pages/Settings';
import { Friends } from './pages/Friends';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { deviceSecret, isLoading } = useAuth();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!deviceSecret) {
    return <Navigate to="/register" replace />;
  }

  return <>{children}</>;
}

function App() {
  return (
    <Theme accentColor="yellow" grayColor="sand" radius="medium">
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/register" element={<Layout />}>
              <Route index element={<Register />} />
            </Route>
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Home />} />
              <Route path="friends" element={<Friends />} />
              <Route path="settings" element={<Settings />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </Theme>
  );
}

export default App;
