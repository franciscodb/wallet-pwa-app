# 🏦 Proyecto de Crédito Descentralizado en Monad

---

## 📖 Descripción
Plataforma de crédito descentralizada que combina **datos tradicionales, alternativos y on-chain** para crear un modelo de *credit scoring* inclusivo y dinámico.  
Construida en **Monad** con autenticación mediante **Reown AppKit SDK**, utiliza inteligencia artificial para evaluar en tiempo real la capacidad crediticia y ofrecer préstamos personalizados, transparentes y accesibles.

---

## 🏗️ Arquitectura del Proyecto
La arquitectura está compuesta por los siguientes módulos principales:

- **Frontend (React Vite PWA):** interfaz para login con Reown, dashboard y flujo de préstamos.  
- **Smart Contracts (Solidity/Monad):** gestión de préstamos, pagos y scoring on-chain.  
- **ML Model (Python):** algoritmo de *credit scoring híbrido* que combina datos demográficos, alternativos y on-chain.

- <img width="1536" height="1024" alt="image" src="https://github.com/user-attachments/assets/db4a2fe8-7371-42e7-a58a-95a9b7932b34" />


📌 **Flujo del sistema:**  
1. Usuario inicia sesión con **Reown AppKit (login con wallet)**.  
2. Se valida y conecta la wallet en **Monad**.  
3. El modelo de **ML** calcula el score crediticio en tiempo real.  
4. Se ofrecen préstamos personalizados y transparentes.  

---

## 🚀 Instalación y Uso

### 1️⃣ Clonar repositorio
```bash
git clone https://github.com/franciscodb/wallet-pwa-app.git
```

### 2️⃣ Instalar dependencias
```bash
cd wallet-pwa-app && npm install
```

### 3️⃣ Ejecutar frontend
```bash
cd wallet-pwa-app
npm run dev

---

## 🖼️ Interfaz de Usuario
Guía de Pantallas

📌 Login
<img width="330" height="712" alt="image" src="https://github.com/user-attachments/assets/5756e3e4-0b21-4755-8721-3b65a88118e5" />


📌 Home
<img width="330" height="708" alt="image" src="https://github.com/user-attachments/assets/44b7e51f-ed71-4f8f-b8e9-c97fc94191dc" />

📌 Mis créditos
<img width="338" height="712" alt="image" src="https://github.com/user-attachments/assets/1d29e439-76d0-4e81-812d-65415577f53c" />

📌 Pedir crédito
<img width="343" height="716" alt="image" src="https://github.com/user-attachments/assets/e69de542-1b29-4a3b-8a80-6a48673a68b2" />
<img width="337" height="721" alt="image" src="https://github.com/user-attachments/assets/0ef40f51-788f-475e-97c1-0fd7edc8c8d8" />
<img width="361" height="729" alt="image" src="https://github.com/user-attachments/assets/28804be2-9afc-4cdc-bf61-eb77a6859451" />


📌 Mi crédito individual / pagar crédito
<img width="346" height="719" alt="image" src="https://github.com/user-attachments/assets/7e0d35d0-09d8-406d-ab4b-2cf4f9637346" />


📌 Oportunidades (créditos para invertir)

<img width="344" height="707" alt="image" src="https://github.com/user-attachments/assets/658f9176-7559-4d67-876c-59ca05f696a3" />

📌 Crédito para invertir
<img width="338" height="718" alt="image" src="https://github.com/user-attachments/assets/1188b24f-5c5a-4b99-85e1-d786d2e528bd" />


📌 Perfil
<img width="350" height="711" alt="image" src="https://github.com/user-attachments/assets/7f0a9bd6-dadf-4379-809c-c8cd2a0d6cf5" />

---
🔗 Explorer del Smart Contract

Nuestro smart contract en Monad puede consultarse directamente desde el explorer para mayor transparencia.

📌
 <img width="1907" height="989" alt="image" src="https://github.com/user-attachments/assets/b73da0ab-238c-4ebb-91c7-2ccd50930a5d" />

📌 Dirección del contrato : 0x0AAc749ceB367Af971419Edd91e263e39FbAE3D8
📌 Dirección del explorer : https://testnet.monadexplorer.com/address/0x0AAc749ceB367Af971419Edd91e263e39FbAE3D8


## 🤝 Contribuciones
Este es un proyecto open source desarrollado para el **Hackathon de Monad**.  
¡Las contribuciones son bienvenidas! 🎉

---

## 📜 Licencia
Este proyecto se publica bajo la licencia **MIT**.  

---

## 🌍 Alineación con ODS
El proyecto se alinea con los **ODS 8 (Trabajo decente y crecimiento económico)** y **ODS 10 (Reducción de las desigualdades)** al impulsar la inclusión financiera en sectores vulnerables en México y permitir que inversionistas generen impacto social con rentabilidad.
