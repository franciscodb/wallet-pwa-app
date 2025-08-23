import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { useDisconnect } from 'wagmi'

function ProfileScreen() {
  const navigate = useNavigate()
  const { user } = useApp()
  const { disconnect } = useDisconnect()

  const handleLogout = () => {
    disconnect()
    navigate('/')
  }

  return (
    <div className="profile-screen">
      <div className="screen-header">
        <button className="back-btn" onClick={() => navigate('/home')}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <h1>Profile</h1>
        <div style={{width: 24}}></div>
      </div>

      <div className="profile-content">
        <div className="profile-header">
          <div className="profile-avatar">
            <span>👤</span>
          </div>
          <h2>{user.name}</h2>
          <p>@{user.email.split('@')[0]}</p>
          <p className="join-date">Joined {user.joinDate}</p>
        </div>

        <div className="score-section">
          <div className="score-card">
            <div className="score-circle">
              <svg width="150" height="150">
                <circle
                  cx="75"
                  cy="75"
                  r="65"
                  stroke="#E5E7EB"
                  strokeWidth="12"
                  fill="none"
                />
                <circle
                  cx="75"
                  cy="75"
                  r="65"
                  stroke="#2D9CDB"
                  strokeWidth="12"
                  fill="none"
                  strokeDasharray={`${user.score * 4.08} 408`}
                  transform="rotate(-90 75 75)"
                />
              </svg>
              <div className="score-value">
                <span className="score-number">{user.score}/100</span>
                <span className="score-label">Personal Score</span>
              </div>
            </div>
          </div>

          <div className="stats-grid">
            <div className="stat-card">
              <span className="stat-value">{user.activeLoans}</span>
              <span className="stat-label">Active Loans</span>
            </div>
            <div className="stat-card">
              <span className="stat-value">{user.pastLoans}</span>
              <span className="stat-label">Past Loans</span>
            </div>
          </div>
        </div>

        <div className="settings-section">
          <h3>Settings</h3>
          <div className="settings-list">
            <div className="setting-item">
              <span>Language</span>
              <select className="language-select">
                <option>English</option>
                <option>Español</option>
                <option>Português</option>
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
              <span>Dark Mode</span>
              <label className="switch">
                <input type="checkbox" />
                <span className="slider-switch"></span>
              </label>
            </div>

            <div className="setting-item">
              <span>Security</span>
              <button className="setting-btn">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M9 11L12 14L22 4M21 12V19C21 20.1046 20.1046 21 19 21H5C3.89543 21 3 20.1046 3 19V5C3 3.89543 3.89543 3 5 3H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>
          </div>
        </div>

        <button className="logout-btn" onClick={handleLogout}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M9 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H9M16 17L21 12M21 12L16 7M21 12H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Disconnect Wallet
        </button>
      </div>
    </div>
  )
}

export default ProfileScreen