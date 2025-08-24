import { useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { useDisconnect, useAccount, useEnsName, useEnsAvatar } from 'wagmi'

const shorten = (addr) => (addr ? `${addr.slice(0, 6)}…${addr.slice(-4)}` : '')

function useWalletProfile() {
  const { address } = useAccount()

  const { data: ensName } = useEnsName({
    address,
    chainId: 1,
    query: { enabled: !!address },
  })
  const { data: ensAvatar } = useEnsAvatar({
    name: ensName,
    chainId: 1,
    query: { enabled: !!ensName },
  })

  const displayName = ensName || shorten(address)
  const handle = ensName ? `@${ensName}` : `@${shorten(address)}`
  const avatarUrl = ensAvatar

  return { address, displayName, handle, avatarUrl }
}

function useJoinDate(isConnected, userJoinDate) {
  useEffect(() => {
    if (!isConnected) return
    if (!localStorage.getItem('pm3_joined_at')) {
      localStorage.setItem('pm3_joined_at', new Date().toISOString())
    }
  }, [isConnected])

  const joinedStr = useMemo(() => {
    if (userJoinDate) return `Joined ${userJoinDate}`
    const iso = localStorage.getItem('pm3_joined_at')
    const d = iso ? new Date(iso) : new Date()
    const label = d.toLocaleString('en-US', { month: 'long', year: 'numeric' })
    return `Joined ${label}`
  }, [userJoinDate])

  return joinedStr
}

function ProfileScreen() {
  const navigate = useNavigate()
  const { user } = useApp()
  const { disconnect } = useDisconnect()
  const { isConnected } = useAccount()

  const { address, displayName, handle, avatarUrl } = useWalletProfile()
  const joinedText = useJoinDate(isConnected, user?.joinDate)

  const handleLogout = () => {
    disconnect()
    navigate('/')
  }

  return (
    <div className="profile-screen">
      {/* top header */}
      <div className="screen-header">
        <button className="back-btn" onClick={() => navigate('/home')}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <h1>Profile</h1>
        <div style={{ width: 24 }} />
      </div>

      <div className="profile-content">
        <div className="profile-header">
          <div className="profile-avatar">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt="avatar"
                style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }}
              />
            ) : (
              <span>👤</span>
            )}
          </div>

          {/* prefer app name if you set it; fallback to ENS/short address */}
          <h2>{user?.name || displayName || 'User'}</h2>

          {/* prefer app handle (from email) if present; else ENS/short address */}
          <p>{user?.email ? `@${user.email.split('@')[0]}` : handle || '@anonymous'}</p>

          <p className="join-date">{joinedText}</p>

          {address && (
            <p style={{ fontSize: 12, color: '#6B7280', marginTop: 6 }}>
              {shorten(address)}
            </p>
          )}
        </div>

        {/* score + stats */}
        <div className="score-section">
          <div className="score-card">
            <div style={{ display: 'grid', placeItems: 'center' }}>
              {/* bigger ring */}
              <svg width="180" height="180">
                <circle cx="90" cy="90" r="78" stroke="#E5E7EB" strokeWidth="14" fill="none" />
                <circle
                  cx="90" cy="90" r="78"
                  stroke="#2D9CDB" strokeWidth="14" fill="none"
                  strokeDasharray={`${(user?.score ?? 0) * 4.9} 490`}
                  transform="rotate(-90 90 90)"
                  strokeLinecap="round"
                />
              </svg>
            </div>

            <div className="score-value">
              <span className="score-number">{(user?.score ?? 0)}/100</span>
              <span className="score-label">Personal Score</span>
            </div>
          </div>

          <div className="stats-grid">
            <div className="stat-card">
              <span className="stat-value">{user?.activeLoans ?? 0}</span>
              <span className="stat-label">Active Loans</span>
            </div>
            <div className="stat-card">
              <span className="stat-value">{user?.pastLoans ?? 0}</span>
              <span className="stat-label">Past Loans</span>
            </div>
          </div>
        </div>

        {/* settings */}
        <div className="settings-section">
          <h3>Settings</h3>
          <div className="settings-list">
            <div className="setting-item">
              <span>Language</span>
              <select className="language-select" defaultValue="English">
                <option>English</option>
              </select>
            </div>

            <div className="setting-item">
              <span>Notifications</span>
              <label className="switch">
                <input type="checkbox" defaultChecked />
                <span className="slider-switch"></span>
              </label>
            </div>

            <div className="setting-item">
              <span>Security</span>
              <button className="setting-btn" aria-label="Security settings">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M9 11L12 14L22 4M21 12V19C21 20.1046 20.1046 21 19 21H5C3.89543 21 3 20.1046 3 19V5C3 3.89543 3.89543 3 5 3H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* logout */}
        <button className="logout-btn" onClick={handleLogout}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M9 21H5C4.47 21 3.96 20.79 3.59 20.41 3.21 20.04 3 19.53 3 19V5c0-.53.21-1.04.59-1.41C3.96 3.21 4.47 3 5 3h4m7 14 5-5-5-5m5 5H9"
              stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Disconnect Wallet
        </button>
      </div>
    </div>
  )
}

export default ProfileScreen