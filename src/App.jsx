import { Routes, Route } from 'react-router-dom'
import WheelPage from './components/WheelPage'
import AddNamePage from './components/AddNamePage'

function App() {
  return (
    <Routes>
      <Route path="/" element={<WheelPage />} />
      <Route path="/add-name" element={<AddNamePage />} />
    </Routes>
  )
}

export default App
