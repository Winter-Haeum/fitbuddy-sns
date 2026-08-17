import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/use-auth';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';

import LoginPage from './pages/login-page';
import RegisterPage from './pages/register-page';
import PrivacyPage from './pages/privacy-page';
import HomePage from './pages/home-page';
import FeedPage from './pages/feed-page';
import PostDetailPage from './pages/post-detail-page';
import PostCreatePage from './pages/post-create-page';
import ProfilePage from './pages/profile-page';
import TimerPage from './pages/timer-page';
import CharacterPage from './pages/character-page';
import MealsPage from './pages/meals-page';
import ChallengesPage from './pages/challenges-page';
import RecordsPage from './pages/records-page';
import TimerMiniPlayer from './components/common/timer-mini-player';

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress sx={{ color: '#6BCB77' }} />
      </Box>
    );
  }

  return user ? children : <Navigate to='/login' replace />;
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth();

  // 로딩이 완전히 끝나고 user가 확인된 경우에만 이동
  // 로딩 중에는 children(LoginPage)을 언마운트하지 않음
  // → 언마운트 시 error/state가 초기화되는 문제 방지
  if (!loading && user) return <Navigate to='/' replace />;

  return children;
}

export default function App() {
  return (
    <>
    <Routes>
      <Route path='/login' element={<PublicRoute><LoginPage /></PublicRoute>} />
      <Route path='/register' element={<PublicRoute><RegisterPage /></PublicRoute>} />
      {/* 로그인 여부와 무관하게 항상 접근 가능해야 하는 공개 페이지(Health Connect rationale이 여는 URL) */}
      <Route path='/privacy' element={<PrivacyPage />} />

      <Route path='/' element={<ProtectedRoute><HomePage /></ProtectedRoute>} />
      <Route path='/feed' element={<ProtectedRoute><FeedPage /></ProtectedRoute>} />
      <Route path='/post/:id' element={<ProtectedRoute><PostDetailPage /></ProtectedRoute>} />
      <Route path='/create' element={<ProtectedRoute><PostCreatePage /></ProtectedRoute>} />
      <Route path='/profile' element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
      <Route path='/timer' element={<ProtectedRoute><TimerPage /></ProtectedRoute>} />
      <Route path='/character' element={<ProtectedRoute><CharacterPage /></ProtectedRoute>} />
      <Route path='/meals' element={<ProtectedRoute><MealsPage /></ProtectedRoute>} />
      <Route path='/challenges' element={<ProtectedRoute><ChallengesPage /></ProtectedRoute>} />
      <Route path='/records' element={<ProtectedRoute><RecordsPage /></ProtectedRoute>} />

      <Route path='*' element={<Navigate to='/' replace />} />
    </Routes>
    <TimerMiniPlayer />
    </>
  );
}
