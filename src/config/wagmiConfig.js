import { WagmiAdapter } from '@reown/appkit-adapter-wagmi'
import { monadTestnet } from '@reown/appkit/networks'
import { createStorage, cookieStorage } from 'wagmi'

// Tu Project ID real de Reown
export const projectId = import.meta.env.VITE_WALLET_CONNECT_PROJECT_ID || 'YOUR_PROJECT_ID'

// Validar Project ID
if (!projectId || projectId === 'YOUR_PROJECT_ID') {
  console.error('⚠️ Por favor configura tu Project ID de Reown')
  console.log('👉 Obtén uno en: https://cloud.reown.com')
}

// Usar Monad Testnet directamente de Reown
export const networks = [monadTestnet]

// Metadata para la app
export const metadata = {
  name: 'Monad P2P Lending',
  description: 'Decentralized P2P Lending Platform on Monad',
  url: typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5173',
  icons: ['https://avatars.githubusercontent.com/u/179374669']
}

// Configurar el Wagmi Adapter con la configuración de Reown
export const wagmiAdapter = new WagmiAdapter({
  storage: createStorage({
    storage: typeof window !== 'undefined' ? window.localStorage : cookieStorage
  }),
  ssr: false,
  networks,
  projectId
})

// Exportar la configuración de Wagmi
export const config = wagmiAdapter.wagmiConfig

// Para compatibilidad con código existente
export const monadTestnetChain = monadTestnet
export const reownNetworks = networks