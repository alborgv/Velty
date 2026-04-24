import AppProviders from './context/AppProviders'
import AppRoutes from './routes/AppRoutes'
import { BrowserRouter } from 'react-router-dom'

function App() {
  return (
    <>
      <BrowserRouter>
        <AppProviders>
          <AppRoutes/>
        </AppProviders>
      </BrowserRouter>
    </>
  )
}

export default App
