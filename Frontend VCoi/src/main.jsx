import React from 'react'
import ReactDOM from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import '@fontsource/be-vietnam-pro/latin-400.css'
import '@fontsource/be-vietnam-pro/latin-500.css'
import '@fontsource/be-vietnam-pro/latin-600.css'
import '@fontsource/be-vietnam-pro/latin-700.css'
import '@fontsource/be-vietnam-pro/vietnamese-400.css'
import '@fontsource/be-vietnam-pro/vietnamese-500.css'
import '@fontsource/be-vietnam-pro/vietnamese-600.css'
import '@fontsource/be-vietnam-pro/vietnamese-700.css'
import App from './App'
import AuthProvider from './features/auth/AuthProvider'
import UnsavedChangesProvider from './features/navigation/UnsavedChangesProvider'
import './styles/tokens.css'
import './styles/layout.css'
import './styles/forms.css'
import './styles/refinement.css'
import { initializeTheme } from './features/theme/theme'
import './styles/review-fixes.css'
import './styles/public-polish.css'
import './styles/admin-motion.css'

initializeTheme()

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 60_000, retry: 1, refetchOnWindowFocus: false } },
})
const router = createBrowserRouter([
  {
    path: '*',
    element: (
      <AuthProvider>
        <UnsavedChangesProvider>
          <App />
        </UnsavedChangesProvider>
      </AuthProvider>
    ),
  },
])

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  </React.StrictMode>,
)
