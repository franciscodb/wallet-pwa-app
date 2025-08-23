import React from 'react'
import ReactDOM from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { WagmiProvider } from 'wagmi'
import { createAppKit } from '@reown/appkit/react'
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi'
import App from './App'
import { config, projectId, metadata, monadTestnet, reownNetworks } from './config/wagmiConfig'
import './styles/App.css'

// Configurar Query Client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
})

// Verificar Project ID
if (!projectId || projectId === 'YOUR_REAL_PROJECT_ID_HERE') {
  alert('⚠️ Por favor configura tu Project ID de Reown en el archivo .env')
}

// Crear el adapter de Wagmi para Reown con la configuración correcta
const wagmiAdapter = new WagmiAdapter({
  networks: reownNetworks,
  projectId,
  ssr: false,
})

// Crear AppKit con la configuración correcta
try {
  createAppKit({
    adapters: [wagmiAdapter],
    networks: reownNetworks,
    projectId,
    metadata,
    features: {
      analytics: false, // Desactivar analytics si no tienes un projectId válido
      email: false,
      socials: false,
      swaps: false,
    },
    themeMode: 'light',
    themeVariables: {
      '--w3m-accent': '#2D9CDB',
      '--w3m-border-radius-master': '12px',
      '--w3m-font-size-master': '16px',
    },
    defaultChain: monadTestnet,
    enableEIP6963: true,
    enableInjected: true,
    enableCoinbase: false,
    enableWalletConnect: true,
  })
} catch (error) {
  console.error('Error creating AppKit:', error)
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </WagmiProvider>
  </React.StrictMode>
)