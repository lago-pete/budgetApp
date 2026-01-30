import React, { useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, AuthContext } from './context/AuthContext';
import LoginPage from './components/LoginPage';
import RegisterPage from './components/RegisterPage';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import SocialHub from './components/SocialHub';
import Challenges from './components/Challenges';
import Profile from './components/Profile';
import CategoriesPage from './components/CategoriesPage';
import TransactionModal from './components/TransactionModal';
import NotificationsDropdown from './components/NotificationsDropdown';

// Protected Route Wrapper
const PrivateRoute = () => {
    const { user, loading } = useContext(AuthContext);
    if (loading) return <div>Loading...</div>;
    return user ? <Outlet /> : <Navigate to="/login" />;
};

function Layout() {
    const { user } = useContext(AuthContext);
    const [activeView, setActiveView] = React.useState('dashboard');
    const [showModal, setShowModal] = React.useState(false);
    const [editTransactionData, setEditTransactionData] = React.useState(null); // For edit mode

    const [refreshKey, setRefreshKey] = React.useState(0);
    const triggerRefresh = () => setRefreshKey(k => k + 1);

    const handleEditTransaction = (txData) => {
        setEditTransactionData(txData);
        setShowModal(true);
    };

    const handleOpenAddModal = () => {
        setEditTransactionData(null);
        setShowModal(true);
    };

    return (
        <div className="app-container">
            <Sidebar activeView={activeView} setActiveView={setActiveView} user={user} />

            <main className="main-content">
                <header className="top-bar">
                    <h2 id="page-title">{activeView.charAt(0).toUpperCase() + activeView.slice(1)}</h2>
                    <div className="actions">
                        <NotificationsDropdown />

                        {activeView === 'dashboard' && (
                            <button className="btn-primary" onClick={handleOpenAddModal}>
                                <i className="fa-solid fa-plus"></i> Add New
                            </button>
                        )}
                    </div>
                </header>

                <div id="views-container">
                    {activeView === 'dashboard' && (
                        <Dashboard
                            key={refreshKey}
                            onEditTransaction={handleEditTransaction}
                        />
                    )}
                    {activeView === 'social' && <SocialHub />}
                    {activeView === 'challenges' && <Challenges />}
                    {activeView === 'profile' && <Profile user={user} />}
                    {activeView === 'categories' && <CategoriesPage onEditTransaction={handleEditTransaction} />}
                </div>
            </main>

            {showModal && (
                <TransactionModal
                    initialData={editTransactionData}
                    onClose={() => setShowModal(false)}
                    onSubmitSuccess={() => { setShowModal(false); triggerRefresh(); }}
                />
            )}
        </div>
    );
}

function App() {
    return (
        <AuthProvider>
            <Router>
                <Routes>
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/register" element={<RegisterPage />} />
                    <Route element={<PrivateRoute />}>
                        <Route path="/*" element={<Layout />} />
                    </Route>
                </Routes>
            </Router>
        </AuthProvider>
    );
}

export default App;
