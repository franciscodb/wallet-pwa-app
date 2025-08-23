// src/utils/addMonadNetwork.js
export async function addMonadTestnetToMetaMask() {
  if (!window.ethereum) {
    console.log('MetaMask no está instalado')
    return false
  }

  try {
    // Intentar agregar la red
    await window.ethereum.request({
      method: 'wallet_addEthereumChain',
      params: [{
        chainId: '0x279F', // 10143 en hexadecimal
        chainName: 'Monad Testnet',
        nativeCurrency: {
          name: 'Monad',
          symbol: 'MON',
          decimals: 18
        },
        rpcUrls: ['https://testnet-rpc.monad.xyz'],
        blockExplorerUrls: ['https://testnet.monadexplorer.com']
      }]
    })
    
    console.log('Red Monad Testnet agregada exitosamente')
    return true
  } catch (error) {
    // Error 4001 significa que el usuario rechazó la solicitud
    if (error.code === 4001) {
      console.log('Usuario rechazó agregar la red')
      return false
    }
    
    // Error 4902 significa que la red ya existe, intentar cambiar a ella
    if (error.code === 4902) {
      try {
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: '0x279F' }]
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