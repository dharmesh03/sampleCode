import Profile from 'pages/Profile';
import { FC, lazy } from 'react';
import { Route, Routes, BrowserRouter } from 'react-router-dom';

const Login = lazy(() => import('pages/user/Login'));
const Dashboard = lazy(() => import('pages/Dashboard'));
const ForgetPassword = lazy(() => import('pages/user/ForgetPassword'));
const ResetPassword = lazy(() => import('pages/user/ResetPassword'));
const CurrentCandidate = lazy(() => import('pages/candidate/CurrentCandidate'));
const CandidatesProfile = lazy(
  () => import('pages/candidate/CandidatesProfile')
);
const CompaniesProfile = lazy(() => import('pages/company/companiesProfile'));
const ContactsProfile = lazy(() => import('pages/contact/ContactsProfile'));
const ListCandidates = lazy(() => import('pages/candidate/ListCandidates'));
const ListProfiles = lazy(() => import('pages/ListProfiles'));
const ListCompanies = lazy(() => import('pages/ListCompanies'));
const ListContacts = lazy(() => import('pages/ListContacts'));
const DashboardLayout = lazy(() => import('layouts/dashboard/DashboardLayout'));

const Routing: FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/login" element={<Login />} />
        <Route path="/forget-password" element={<ForgetPassword />} />
        <Route path="/candidate" element={<CurrentCandidate />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/profile" element={<Profile />} />

        <Route
          path="/dashboard/analytics"
          element={
            <DashboardLayout>
              <Dashboard />
            </DashboardLayout>
          }
        />
        <Route
          path="/dashboard/candidates"
          element={
            <DashboardLayout>
              <ListCandidates />
            </DashboardLayout>
          }
        />
        <Route
          path="/dashboard/candidates/view-profile"
          element={
            <DashboardLayout>
              <CandidatesProfile />
            </DashboardLayout>
          }
        />
        <Route
          path="/dashboard/profiles"
          element={
            <DashboardLayout>
              <ListProfiles />
            </DashboardLayout>
          }
        />
        <Route
          path="/dashboard/companies"
          element={
            <DashboardLayout>
              <ListCompanies />
            </DashboardLayout>
          }
        />
        <Route
          path="/dashboard/companies/profile"
          element={
            <DashboardLayout>
              <CompaniesProfile />
            </DashboardLayout>
          }
        />
        <Route
          path="/dashboard/contacts"
          element={
            <DashboardLayout>
              <ListContacts />
            </DashboardLayout>
          }
        />
        <Route
          path="/dashboard/contacts/profile"
          element={
            <DashboardLayout>
              <ContactsProfile />
            </DashboardLayout>
          }
        />
      </Routes>
    </BrowserRouter>
  );
};

export default Routing;
