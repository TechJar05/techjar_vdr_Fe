import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import Sidebar from "./components/Global/Sidebar";
import Topbar from "./components/Global/Topbar";
import DashboardPage from "./pages/dashboard/ProjectSection/DashboardPage";
import FavouritePage from "./pages/dashboard/FavouritePage";
import UserPage from "./pages/dashboard/UserPage";
import UserGroupPage from "./pages/dashboard/UserGroupPage";
import UserAccessRequestPage from "./pages/dashboard/UserAccessRequestPage";
import LogsPage from "./pages/dashboard/UserLogsPage";
import TrashPage from "./pages/dashboard/TrashPage";
import ReportsPage from "./pages/dashboard/ReportsPage";
import SettingPage from "./pages/dashboard/SettingPage";
import StoragePage from "./pages/dashboard/StoragePage";
import LoginPage from "./pages/Auth/LoginPage";
import RegisterPage from "./pages/Auth/RegisterPage";
import FolderPage from './pages/dashboard/ProjectSection/FolderPage';

const DashboardLayout = ({ sidebarOpen, toggleSidebar }) => (
  <div style={{ display: "flex", height: "100vh" }}>
    <Sidebar isOpen={sidebarOpen} />
    <div
      style={{
        flexGrow: 1,
        transition: "margin-left 0.3s ease",
        marginLeft: sidebarOpen ? "230px" : "0px",
        background: "#f9fafb",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Topbar
        onToggleSidebar={toggleSidebar}
        sidebarOpen={sidebarOpen}
        // user={{ fullName}}
      />
      <div style={{ flexGrow: 1, overflowY: "auto", padding: "20px" }}>
        <Routes>
          {/* Dashboard routes (keep these inside the layout) */}
          <Route path="/project" element={<DashboardPage />} />
          <Route path="/project-folder/:id" element={<FolderPage />} />
          <Route path="/storage" element={<StoragePage />} />
          <Route path="/favourite" element={<FavouritePage />} />
          <Route path="/users" element={<UserPage />} />
          <Route path="/userGroup" element={<UserGroupPage />} />
          <Route path="/userAccess" element={<UserAccessRequestPage />} />
          <Route path="/logs" element={<LogsPage />} />
          <Route path="/trash" element={<TrashPage />} />
          <Route path="/reports" element={<ReportsPage />} />
          <Route path="/setting" element={<SettingPage />} />
        </Routes>
      </div>
    </div>
  </div>
);

const AppWrapper = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
  const location = useLocation();

  // Treat both "/" and "/register" as pages that should hide the dashboard layout
  const hideLayout = location.pathname === "/" || location.pathname === "/register";

  return (
    <>
      {hideLayout ? (
        // When layout is hidden, render routes for login/register (full-screen)
        <Routes>
          <Route path="/" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
        </Routes>
      ) : (
        // Dashboard layout with its own nested routes
        <DashboardLayout sidebarOpen={sidebarOpen} toggleSidebar={toggleSidebar} />
      )}
    </>
  );
};

const App = () => (
  <Router>
    <AppWrapper />
  </Router>
);

export default App;
