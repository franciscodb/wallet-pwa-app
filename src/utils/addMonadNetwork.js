// Función helper para agregar Monad Testnet a MetaMask
export async function addMonadTestnetToMetaMask() {
  if (!window.ethereum) {
    console.log('MetaMask no está instalado')
    return false
  }

  try {
    // Los valores de Monad Testnet según Reown
    await window.ethereum.request({
      method: 'wallet_addEthereumChain',
      params: [{
        chainId: '0xA1EE', // 41454 en hex (es el chain ID oficial de Monad en Reown)
        chainName: 'Monad Testnet',
        nativeCurrency: {
          name: 'Monad',
          symbol: 'MON',
          decimals: 18
        },
        rpcUrls: ['https://testnet.monad.xyz'],
        blockExplorerUrls: ['https://explorer.testnet.monad.xyz']
      }]
    })
    
    console.log('Red Monad Testnet agregada exitosamente')
    return true
  } catch (error) {
    // Si la red ya existe, intentar cambiar a ella
    if (error.code === 4902) {
      try {
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: '0xA1EE' }]
        })
        console.log('Cambiado a Monad Testnet')
        return true
      } catch (switchError) {
        console.error('Error al cambiar de red:', switchError)
        return false
      }
    }
    
    console.error('Error agregando red:', error)
    return false
  }
}