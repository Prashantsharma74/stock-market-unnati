import { Navigate, Route, Routes } from 'react-router-dom'
import { GuestRoute, ProtectedRoute } from './components/auth/RouteGuards.tsx'
import { AppShell } from './components/layout/AppShell.tsx'
import { ToastProvider } from './components/ui/Toast.tsx'
import { MarketPage } from './features/market/MarketPage.tsx'
import { CalculatorPage } from './pages/calculators/CalculatorPage.tsx'
import { DevMailboxPage } from './pages/DevMailboxPage.tsx'
import { FoExplorePage, FoOrdersPage, FoPositionsPage } from './pages/fo/FoPages.tsx'
import { ForgotPasswordPage } from './pages/ForgotPasswordPage.tsx'
import { FundWatchlistPage, FundsDashboardPage, FundsExplorePage, SipsPage } from './pages/funds/FundPages.tsx'
import { InstrumentPage } from './pages/InstrumentPage.tsx'
import { LandingPage } from './pages/LandingPage.tsx'
import { LoginPage } from './pages/LoginPage.tsx'
import { ModulePage } from './pages/ModulePage.tsx'
import { NotFoundPage } from './pages/NotFoundPage.tsx'
import { ProfilePage } from './pages/ProfilePage.tsx'
import { RegisterPage } from './pages/RegisterPage.tsx'
import { ResetPasswordPage } from './pages/ResetPasswordPage.tsx'
import { StockHoldingsPage, StockOrdersPage, StockPositionsPage, StockWatchlistPage, StocksExplorePage } from './pages/stocks/StockPages.tsx'
import { VerifyEmailPage } from './pages/VerifyEmailPage.tsx'

export default function App() {
  return (
    <ToastProvider>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route element={<GuestRoute />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
        </Route>
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/verify-email" element={<VerifyEmailPage />} />
        <Route path="/dev/mailbox" element={<DevMailboxPage />} />
        <Route element={<ProtectedRoute />}>
          <Route element={<AppShell />}>
            <Route path="/app" element={<Navigate to="/app/stocks/explore" replace />} />
            <Route path="/app/stocks/explore" element={<StocksExplorePage />} />
            <Route path="/app/stocks/holdings" element={<StockHoldingsPage />} />
            <Route path="/app/stocks/positions" element={<StockPositionsPage />} />
            <Route path="/app/stocks/orders" element={<StockOrdersPage />} />
            <Route path="/app/stocks/watchlist" element={<StockWatchlistPage />} />
            <Route path="/app/market" element={<MarketPage />} />
            <Route path="/app/fo/explore" element={<FoExplorePage />} />
            <Route path="/app/fo/positions" element={<FoPositionsPage />} />
            <Route path="/app/fo/orders" element={<FoOrdersPage />} />
            <Route path="/app/funds/explore" element={<FundsExplorePage />} />
            <Route path="/app/funds/dashboard" element={<FundsDashboardPage />} />
            <Route path="/app/funds/sips" element={<SipsPage />} />
            <Route path="/app/funds/watchlist" element={<FundWatchlistPage />} />
            <Route path="/app/calculators" element={<CalculatorPage />} />
            <Route path="/app/profile" element={<ProfilePage />} />
            <Route path="/app/instruments/:id" element={<InstrumentPage />} />
            <Route path="/app/admin" element={<ModulePage moduleKey="admin" />} />
            <Route path="/app/funds" element={<Navigate to="/app/funds/explore" replace />} />
            <Route path="/app/stocks" element={<Navigate to="/app/stocks/explore" replace />} />
            <Route path="/app/watchlist" element={<Navigate to="/app/stocks/watchlist" replace />} />
            <Route path="/app/portfolio" element={<Navigate to="/app/funds/dashboard" replace />} />
            <Route path="/app/learn" element={<ModulePage moduleKey="learn" />} />
            <Route path="/app/*" element={<NotFoundPage />} />
          </Route>
        </Route>
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </ToastProvider>
  )
}
