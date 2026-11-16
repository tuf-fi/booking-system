import { useEffect } from 'react'
import { HashRouter, Route, Routes } from 'react-router-dom'
import { AdminLayout } from './components/admin/AdminLayout'
import { SiteLayout } from './components/SiteLayout'
import { ToastProvider } from './components/Toast'
import { AdminCalendar } from './pages/admin/AdminCalendar'
import { Bookings } from './pages/admin/Bookings'
import { Dashboard } from './pages/admin/Dashboard'
import { Reports } from './pages/admin/Reports'
import { RoomsAndRates } from './pages/admin/RoomsAndRates'
import { AccountLayout } from './pages/account/AccountLayout'
import { Profile } from './pages/account/Profile'
import { Saved } from './pages/account/Saved'
import { Security } from './pages/account/Security'
import { Trips } from './pages/account/Trips'
import { Auth } from './pages/Auth'
import { Book } from './pages/Book'
import { Confirmation } from './pages/Confirmation'
import { Home } from './pages/Home'
import { Manage } from './pages/Manage'
import { sweepExpired } from './store/api'

function NotFound() {
  return (
    <div className="container-page py-24 text-center">
      <h1 className="text-4xl font-extrabold">Page not found</h1>
      <p className="mt-3 text-muted">That page does not exist. Head back to the inn.</p>
      <a href="#/" className="btn btn-dark mt-8">Back to Lantaw Inn</a>
    </div>
  )
}

export default function App() {
  useEffect(() => {
    sweepExpired()
    const timer = window.setInterval(sweepExpired, 15_000)
    return () => window.clearInterval(timer)
  }, [])

  return (
    <ToastProvider>
      <HashRouter>
        <Routes>
          <Route element={<SiteLayout />}>
            <Route index element={<Home />} />
            <Route path="book" element={<Book />} />
            <Route path="booking/:reference" element={<Confirmation />} />
            <Route path="manage" element={<Manage />} />
            <Route path="account" element={<AccountLayout />}>
              <Route index element={<Trips />} />
              <Route path="saved" element={<Saved />} />
              <Route path="profile" element={<Profile />} />
              <Route path="security" element={<Security />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Route>
          <Route path="signin" element={<Auth mode="signin" />} />
          <Route path="signup" element={<Auth mode="signup" />} />
          <Route path="forgot" element={<Auth mode="forgot" />} />
          <Route path="admin" element={<AdminLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="bookings" element={<Bookings />} />
            <Route path="calendar" element={<AdminCalendar />} />
            <Route path="rooms" element={<RoomsAndRates />} />
            <Route path="reports" element={<Reports />} />
          </Route>
        </Routes>
      </HashRouter>
    </ToastProvider>
  )
}
