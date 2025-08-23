import { createConfig, http } from 'wagmi'
import { walletConnect, injected } from 'wagmi/connectors'

// Definición correcta de Monad Testnet para Reown
export const monadTestnet = {
  id: 10143,
  name: 'Monad Testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'Monad',
    symbol: 'MON',
  },
  rpcUrls: {
    default: {
      http: ['https://testnet-rpc.monad.xyz'],
    },
    public: {
      http: ['https://testnet.monad.xyz'],
    },
  },
  blockExplorers: {
    default: { 
      name: 'Monad Explorer', 
      url: 'https://explorer.testnet.monad.xyz' 
    },
  },
  testnet: true,
}

// IMPORTANTE: Reemplaza con tu Project ID real de Reown
const projectId = import.meta.env.VITE_WALLET_CONNECT_PROJECT_ID || 'dcfea972dbccea562c6aee058329b34c' 

// Validar que el projectId existe
if (!projectId || projectId ===  'dcfea972dbccea562c6aee058329b34c' || projectId ===  'dcfea972dbccea562c6aee058329b34c') {
  console.error('⚠️ Por favor configura un Project ID válido de Reown/WalletConnect')
  console.log('👉 Obtén uno en: https://cloud.reown.com')
}

// Metadata para WalletConnect
const metadata = {
  name: 'Monad P2P Lending',
  description: 'Decentralized P2P Lending Platform on Monad',
  url: typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5173',
  icons: ['https://avatars.githubusercontent.com/u/179374669']
}

// Crear configuración de Wagmi
export const config = createConfig({
  chains: [monadTestnet],
  transports: {
    [monadTestnet.id]: http('https://testnet.monad.xyz'),
  },
  connectors: [
    injected({
      shimDisconnect: true,
      target() {
        return {
          id: 'metaMask',
          name: 'MetaMask',
          provider: typeof window !== 'undefined' ? window.ethereum : undefined,
        }
      }
    }),
    walletConnect({
      projectId,
      metadata,
      showQrModal: false, // Reown maneja su propio modal
      chains: [monadTestnet],
    }),
  ],
})

// Configuración específica para Reown AppKit (formato CAIP)
export const reownNetworks = [
  {
    id: 10143,
    name: 'Monad Testnet',
    nativeCurrency: {
      name: 'Monad',
      symbol: 'MON',
      decimals: 18,
    },
    rpcUrls: {
      default: {
        http: ['https://testnet-rpc.monad.xyz'],
      },
    },
    blockExplorers: {
      default: {
        name: 'Monad Explorer',
        url: 'https://explorer.testnet.monad.xyz',
      },
    },
    testnet: true,
    // Propiedades adicionales para Reown
    chainNamespace: 'eip155',
    caipNetworkId: 'eip155:41454',
  }
]

export { projectId, metadata }