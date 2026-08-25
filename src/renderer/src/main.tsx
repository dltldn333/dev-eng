import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { installBrowserApiStub } from './dev/browserApi'
import './styles.css'

// Electron 밖(브라우저)에서 열었을 때만 예시 데이터로 채운다.
installBrowserApiStub()

const container = document.getElementById('root')
if (!container) throw new Error('#root 엘리먼트를 찾지 못했습니다')

createRoot(container).render(
  <StrictMode>
    <App />
  </StrictMode>
)
