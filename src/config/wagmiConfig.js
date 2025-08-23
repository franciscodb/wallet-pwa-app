import { createConfig, http } from 'wagmi'
import { mainnet, polygon, arbitrum, optimism } from 'wagmi/chains'
import { walletConnect, injected } from 'wagmi/connectors'

// Obtén tu projectId de https://cloud.reown.com
const projectId = 'dcfea972dbccea562c6aee058329b34c' // IMPORTANTE: Reemplaza esto

export const config = createConfig({
  chains: [mainnet, polygon, arbitrum, optimism],
  connectors: [
    injected(),
    walletConnect({ 
      projectId,
      metadata: {
        name: 'Wallet PWA App',
        description: 'PWA con conexión de wallet',
        url: 'https://tu-dominio.com',
        icons: ['https://tu-dominio.com/icon.png']
      }
    })
  ],
  transports: {
    [mainnet.id]: http(),
    [polygon.id]: http(),
    [arbitrum.id]: http(),
    [optimism.id]: http()
  }
})

export { projectId }