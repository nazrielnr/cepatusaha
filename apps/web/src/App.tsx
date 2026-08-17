import { BrowserRouter } from 'react-router-dom'
import { AppProviders } from '@/components/App/AppProviders'
import { AppContent } from '@/components/App/AppContent'

/**
 * App component
 *
 * Entry point for the application
 * - Sets up BrowserRouter for routing
 * - Wraps application with AppProviders (theme, auth callbacks)
 * - Renders AppContent (main application logic)
 *
 * This component is kept minimal (< 100 lines) with all business logic
 * delegated to AppContent and custom hooks.
 */
export default function App() {
  return (
    <BrowserRouter>
      <AppProviders>
        <AppContent />
      </AppProviders>
    </BrowserRouter>
  )
}
