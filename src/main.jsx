import React from 'react'
import ReactDOM from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { WagmiProvider } from 'wagmi'
import { createAppKit } from '@reown/appkit/react'
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi'
import App from './App'
import { config, projectId } from './config/wagmiConfig'
import './styles/App.css'

// Configurar Query Client
const queryClient = new QueryClient()

// Configurar metadata
const metadata = {
  name: 'Wallet PWA App',
  description: 'PWA con conexión de wallet',
  url: 'https://tu-dominio.com',
  icons: ['https://tu-dominio.com/icon.png']
}

// Crear adapter de Wagmi
const wagmiAdapter = new WagmiAdapter({
  networks: [config.chains[0], config.chains[1], config.chains[2], config.chains[3]],
  projectId,
  ssr: false
})

// Crear AppKit
createAppKit({
  adapters: [wagmiAdapter],
  networks: [config.chains[0], config.chains[1], config.chains[2], config.chains[3]],
  projectId,
  metadata,
  features: {
    analytics: true,
    email: false,
    socials: false
  },
  themeMode: 'light',
  themeVariables: {
    '--w3m-accent': '#4A90E2',
    '--w3m-border-radius-master': '12px'
  }
})

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </WagmiProvider>
  </React.StrictMode>
)