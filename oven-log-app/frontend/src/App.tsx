import { useState, useEffect } from 'react'
import './App.css'

const API_BASE = '/api'

interface Trak {
  id: number
  trakId: string
  partNumber: string
  serialNumber?: string
  workOrder?: string
  quantity: number
  isActive: boolean
}

interface Box {
  id: number
  type: string
  manufacturer: string
  model: string
  toolNumber: string
  location: string
  defaultTemperature: number
  warmUpTimeMinutes?: number
}

interface Application {
  id: number
  name: string
  defaultBakeTimeMinutes?: number
}

interface EventInOven {
  id: number
  trakId: string
  partNumber: string
  serialNumber?: string
  boxId: number
  boxName: string
  location: string
  userBadge: string
  applicationName?: string
  temperature: number
  quantity: number
  ovenInTime: string
  plannedBakeTimeMinutes: number
  timeRemainingMinutes?: number
  notes?: string
}

interface HistoryEvent {
  id: number
  trakId: string
  boxName: string
  location: string
  temperature: number
  quantity: number
  ovenInTime: string
  ovenOutTime?: string
  plannedBakeTimeMinutes: number
  actualBakeTimeMinutes?: number
  applicationName?: string
  notes?: string
  userBadge: string
}

function App() {
  const [userBadge, setUserBadge] = useState<string | null>(null)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [loginBadgeInput, setLoginBadgeInput] = useState('')
  
  const [trakId, setTrakId] = useState('')
  const [selectedBox, setSelectedBox] = useState<number | null>(null)
  const [selectedApplication, setSelectedApplication] = useState<number | null>(null)
  const [temperature, setTemperature] = useState(150)
  const [quantity, setQuantity] = useState(1)
  const [bakeTime, setBakeTime] = useState(60)
  const [startTime, setStartTime] = useState('')
  const [notes, setNotes] = useState('')
  const [barcodeMode, setBarcodeMode] = useState(true)
  
  const [boxes, setBoxes] = useState<Box[]>([])
  const [applications, setApplications] = useState<Application[]>([])
  const [eventsInOvens, setEventsInOvens] = useState<EventInOven[]>([])
  const [availableTraks, setAvailableTraks] = useState<string[]>([])
  const [selectedTraks, setSelectedTraks] = useState<string[]>([])
  
  const [showHistory, setShowHistory] = useState(false)
  const [historyData, setHistoryData] = useState<HistoryEvent[]>([])
  const [historyTrakId, setHistoryTrakId] = useState('')
  
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    const storedBadge = localStorage.getItem('userBadge')
    if (storedBadge) {
      setUserBadge(storedBadge)
      setIsLoggedIn(true)
    }
  }, [])

  useEffect(() => {
    if (isLoggedIn) {
      loadBoxes()
      loadApplications()
      loadEventsInOvens()
      const interval = setInterval(loadEventsInOvens, 30000)
      return () => clearInterval(interval)
    }
  }, [isLoggedIn])

  useEffect(() => {
    const now = new Date()
    const formatted = now.toISOString().slice(0, 16)
    setStartTime(formatted)
  }, [])

  const handleLogin = () => {
    if (!loginBadgeInput.trim()) {
      setError('Please enter a badge ID')
      setTimeout(() => setError(''), 3000)
      return
    }
    
    localStorage.setItem('userBadge', loginBadgeInput.trim())
    setUserBadge(loginBadgeInput.trim())
    setIsLoggedIn(true)
    setLoginBadgeInput('')
  }

  const handleLogout = () => {
    localStorage.removeItem('userBadge')
    setUserBadge(null)
    setIsLoggedIn(false)
    setTrakId('')
    setSelectedBox(null)
    setSelectedApplication(null)
    setTemperature(150)
    setQuantity(1)
    setBakeTime(60)
    setNotes('')
    setAvailableTraks([])
    setSelectedTraks([])
    setEventsInOvens([])
  }

  const loadBoxes = async () => {
    try {
      const response = await fetch(`${API_BASE}/boxes`)
      const data = await response.json()
      setBoxes(data)
    } catch (err) {
      setError('Failed to load boxes')
    }
  }

  const loadApplications = async () => {
    try {
      const response = await fetch(`${API_BASE}/applications`)
      const data = await response.json()
      setApplications(data)
    } catch (err) {
      setError('Failed to load applications')
    }
  }

  const loadEventsInOvens = async () => {
    try {
      const response = await fetch(`${API_BASE}/events/in-ovens`)
      const data = await response.json()
      setEventsInOvens(data)
    } catch (err) {
      setError('Failed to load events in ovens')
    }
  }

  const handleAddTrakToList = async () => {
    if (!trakId.trim()) return

    try {
      const response = await fetch(`${API_BASE}/traks/${trakId}`)
      if (response.ok) {
        const trak = await response.json()
        if (trak.isActive && !availableTraks.includes(trakId)) {
          setAvailableTraks([...availableTraks, trakId])
          setSelectedTraks([...selectedTraks, trakId])
          setTrakId('')
        } else if (!trak.isActive) {
          setError('TRAK is not active')
          setTimeout(() => setError(''), 3000)
        } else {
          setError('TRAK already in list')
          setTimeout(() => setError(''), 3000)
        }
      } else {
        const createResponse = await fetch(`${API_BASE}/traks`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            trakId,
            partNumber: `PART-${trakId}`,
            quantity: 1
          })
        })
        if (createResponse.ok) {
          setAvailableTraks([...availableTraks, trakId])
          setSelectedTraks([...selectedTraks, trakId])
          setTrakId('')
        }
      }
    } catch (err) {
      console.error('Error adding TRAK to list:', err)
    }
  }

  const handleCheckAll = () => {
    if (selectedTraks.length === availableTraks.length) {
      setSelectedTraks([])
    } else {
      setSelectedTraks([...availableTraks])
    }
  }

  const toggleTrakSelection = (trakId: string) => {
    if (selectedTraks.includes(trakId)) {
      setSelectedTraks(selectedTraks.filter(t => t !== trakId))
    } else {
      setSelectedTraks([...selectedTraks, trakId])
    }
  }

  const handleAddToOven = async () => {
    if (selectedTraks.length === 0) {
      setError('Please select at least one TRAK')
      setTimeout(() => setError(''), 3000)
      return
    }

    if (!selectedBox) {
      setError('Please select an oven')
      setTimeout(() => setError(''), 3000)
      return
    }

    try {
      if (selectedTraks.length === 1) {
        const eventResponse = await fetch(`${API_BASE}/events`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            trakId: selectedTraks[0],
            boxId: selectedBox,
            applicationId: selectedApplication,
            temperature,
            quantity,
            plannedBakeTimeMinutes: bakeTime,
            notes
          })
        })

        if (!eventResponse.ok) {
          const errorData = await eventResponse.json()
          throw new Error(errorData.title || 'Failed to add TRAK to oven')
        }
      } else {
        const batchResponse = await fetch(`${API_BASE}/events/batch`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            trakIds: selectedTraks,
            boxId: selectedBox,
            applicationId: selectedApplication,
            temperature,
            quantity,
            plannedBakeTimeMinutes: bakeTime,
            notes
          })
        })

        if (!batchResponse.ok) {
          const errorData = await batchResponse.json()
          throw new Error(errorData.title || 'Failed to add TRAKs to oven')
        }
      }

      setMessage(`${selectedTraks.length} TRAK(s) added to oven successfully`)
      setAvailableTraks(availableTraks.filter(t => !selectedTraks.includes(t)))
      setSelectedTraks([])
      setNotes('')
      loadEventsInOvens()
      setTimeout(() => setMessage(''), 3000)
    } catch (err: any) {
      setError(err.message)
      setTimeout(() => setError(''), 5000)
    }
  }

  const handleRemoveFromOven = async (eventId: number) => {
    try {
      const response = await fetch(`${API_BASE}/events/${eventId}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        throw new Error('Failed to remove TRAK from oven')
      }

      setMessage('TRAK removed from oven successfully')
      loadEventsInOvens()
      setTimeout(() => setMessage(''), 3000)
    } catch (err: any) {
      setError(err.message)
      setTimeout(() => setError(''), 5000)
    }
  }

  const handleViewHistory = async () => {
    if (selectedTraks.length === 0) {
      setError('Please select a TRAK to view history')
      setTimeout(() => setError(''), 3000)
      return
    }

    const trakIdToView = selectedTraks[0]
    setHistoryTrakId(trakIdToView)

    try {
      const response = await fetch(`${API_BASE}/traks/${trakIdToView}/history`)
      if (response.ok) {
        const data = await response.json()
        setHistoryData(data)
        setShowHistory(true)
      } else {
        setError('Failed to load TRAK history')
        setTimeout(() => setError(''), 3000)
      }
    } catch (err) {
      setError('Failed to load TRAK history')
      setTimeout(() => setError(''), 3000)
    }
  }

  const handleOvenOn = async () => {
    if (!selectedBox) {
      setError('Please select an oven')
      setTimeout(() => setError(''), 3000)
      return
    }

    try {
      const response = await fetch(`${API_BASE}/boxes/${selectedBox}/turn-on`, {
        method: 'POST'
      })

      if (response.ok) {
        const data = await response.json()
        setMessage(data.message || 'Oven turn-on logged successfully')
        setTimeout(() => setMessage(''), 3000)
      } else {
        const errorData = await response.json()
        setError(errorData.title || 'Failed to log oven turn-on')
        setTimeout(() => setError(''), 3000)
      }
    } catch (err) {
      setError('Failed to log oven turn-on')
      setTimeout(() => setError(''), 3000)
    }
  }

  const handleBoxChange = (boxId: number) => {
    setSelectedBox(boxId)
    const box = boxes.find(b => b.id === boxId)
    if (box) {
      setTemperature(box.defaultTemperature)
    }
  }

  const handleApplicationChange = (appId: number | null) => {
    setSelectedApplication(appId)
    if (appId) {
      const app = applications.find(a => a.id === appId)
      if (app && app.defaultBakeTimeMinutes) {
        setBakeTime(app.defaultBakeTimeMinutes)
      }
    }
  }

  const handleReset = () => {
    setTrakId('')
    setSelectedBox(null)
    setSelectedApplication(null)
    setTemperature(150)
    setQuantity(1)
    setBakeTime(60)
    setNotes('')
    setAvailableTraks([])
    setSelectedTraks([])
    const now = new Date()
    setStartTime(now.toISOString().slice(0, 16))
    loadEventsInOvens()
  }

  const formatTimeRemaining = (minutes?: number) => {
    if (minutes === undefined || minutes === null) return 'N/A'
    if (minutes <= 0) return 'Complete'
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return `${hours}h ${mins}m`
  }

  const formatDateTime = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleString()
  }

  if (!isLoggedIn) {
    return (
      <div className="app">
        <div className="login-container">
          <div className="login-box">
            <h1>Oven Log</h1>
            <h2>User Login</h2>
            {error && <div className="message error">{error}</div>}
            <div className="form-group">
              <label>Badge ID:</label>
              <input
                type="text"
                value={loginBadgeInput}
                onChange={(e) => setLoginBadgeInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
                placeholder="Enter your badge ID"
                autoFocus
              />
            </div>
            <button className="btn btn-primary" onClick={handleLogin}>
              Sign In
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="app">
      <header className="header">
        <h1>Oven Log</h1>
        <div className="header-right">
          <div className="user-info">
            <span className="user-badge">User: {userBadge}</span>
            <button className="btn btn-small btn-secondary" onClick={handleLogout}>
              Sign Out
            </button>
          </div>
          <div className="mode-toggle">
            <button 
              className={`btn ${barcodeMode ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setBarcodeMode(!barcodeMode)}
            >
              {barcodeMode ? 'BARCODE MODE' : 'MANUAL MODE'}
            </button>
            <span className="mode-hint">
              {barcodeMode ? 'Lock for barcode entry' : 'Unlock for manual entry'}
            </span>
          </div>
        </div>
      </header>

      <div className="container">
        {message && <div className="message success">{message}</div>}
        {error && <div className="message error">{error}</div>}

        <div className="main-content">
          <div className="left-panel">
            <div className="trak-input-section">
              <h2>Add TRAK to Oven</h2>
              
              <div className="form-group">
                <label>TRAK ID:</label>
                <div className="input-with-button">
                  <input
                    type="text"
                    value={trakId}
                    onChange={(e) => setTrakId(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleAddTrakToList()}
                    placeholder="Enter or scan TRAK ID"
                  />
                </div>
              </div>

              <div className="trak-list-section">
                <div className="trak-list-header">
                  <h3>TRAK List</h3>
                  <button className="btn btn-small" onClick={handleCheckAll}>
                    ✓ Check All
                  </button>
                </div>
                <div className="trak-list">
                  {availableTraks.length === 0 ? (
                    <div className="empty-list">No TRAKs added</div>
                  ) : (
                    availableTraks.map(trak => (
                      <div 
                        key={trak} 
                        className={`trak-item ${selectedTraks.includes(trak) ? 'selected' : ''}`}
                        onClick={() => toggleTrakSelection(trak)}
                      >
                        <input 
                          type="checkbox" 
                          checked={selectedTraks.includes(trak)}
                          onChange={() => {}}
                        />
                        <span>{trak}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            <div className="form-section">
              <div className="form-group">
                <label>Oven:</label>
                <select
                  value={selectedBox || ''}
                  onChange={(e) => handleBoxChange(Number(e.target.value))}
                >
                  <option value="">Select Oven</option>
                  {boxes.map(box => (
                    <option key={box.id} value={box.id}>
                      {box.toolNumber} - {box.location}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Temperature (°C):</label>
                <input
                  type="number"
                  value={temperature}
                  onChange={(e) => setTemperature(Number(e.target.value))}
                />
              </div>

              <div className="form-group">
                <label>Start Time:</label>
                <input
                  type="datetime-local"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>Application:</label>
                <select
                  value={selectedApplication || ''}
                  onChange={(e) => handleApplicationChange(e.target.value ? Number(e.target.value) : null)}
                >
                  <option value="">Select Application (Optional)</option>
                  {applications.map(app => (
                    <option key={app.id} value={app.id}>
                      {app.name} {app.defaultBakeTimeMinutes ? `(${app.defaultBakeTimeMinutes} min)` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Bake Time (minutes):</label>
                <input
                  type="number"
                  value={bakeTime}
                  onChange={(e) => setBakeTime(Number(e.target.value))}
                />
              </div>

              <div className="form-group">
                <label>Quantity:</label>
                <input
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(Number(e.target.value))}
                />
              </div>

              <div className="form-group">
                <label>Notes:</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                />
              </div>
            </div>

            <div className="button-group">
              <button className="btn btn-primary" onClick={handleAddToOven}>
                Add
              </button>
              <button className="btn btn-secondary" onClick={handleViewHistory}>
                History
              </button>
              <button className="btn btn-secondary" onClick={handleReset}>
                Reset
              </button>
              <button className="btn btn-secondary" onClick={handleOvenOn}>
                Oven On
              </button>
            </div>
          </div>

          <div className="right-panel">
            <h2>TRAKs in Ovens</h2>
            
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>TRAK ID</th>
                    <th>Part Number</th>
                    <th>Oven</th>
                    <th>Location</th>
                    <th>Temp (°C)</th>
                    <th>Application</th>
                    <th>Time Remaining</th>
                    <th>Qty</th>
                    <th>User</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {eventsInOvens.length === 0 ? (
                    <tr>
                      <td colSpan={10} style={{ textAlign: 'center' }}>No TRAKs in ovens</td>
                    </tr>
                  ) : (
                    eventsInOvens.map(event => (
                      <tr key={event.id}>
                        <td>{event.trakId}</td>
                        <td>{event.partNumber}</td>
                        <td>{event.boxName}</td>
                        <td>{event.location}</td>
                        <td>{event.temperature}</td>
                        <td>{event.applicationName || '-'}</td>
                        <td>{formatTimeRemaining(event.timeRemainingMinutes)}</td>
                        <td>{event.quantity}</td>
                        <td>{event.userBadge}</td>
                        <td>
                          <button
                            className="btn btn-small btn-danger"
                            onClick={() => handleRemoveFromOven(event.id)}
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {showHistory && (
        <div className="modal-overlay" onClick={() => setShowHistory(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>TRAK History: {historyTrakId}</h2>
              <button className="btn btn-small" onClick={() => setShowHistory(false)}>
                Close
              </button>
            </div>
            <div className="modal-body">
              {historyData.length === 0 ? (
                <p>No history found for this TRAK</p>
              ) : (
                <table>
                  <thead>
                    <tr>
                      <th>Oven</th>
                      <th>Location</th>
                      <th>Temp (°C)</th>
                      <th>In Time</th>
                      <th>Out Time</th>
                      <th>Planned (min)</th>
                      <th>Actual (min)</th>
                      <th>Application</th>
                      <th>User</th>
                      <th>Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {historyData.map(event => (
                      <tr key={event.id}>
                        <td>{event.boxName}</td>
                        <td>{event.location}</td>
                        <td>{event.temperature}</td>
                        <td>{formatDateTime(event.ovenInTime)}</td>
                        <td>{event.ovenOutTime ? formatDateTime(event.ovenOutTime) : 'In Oven'}</td>
                        <td>{event.plannedBakeTimeMinutes}</td>
                        <td>{event.actualBakeTimeMinutes || '-'}</td>
                        <td>{event.applicationName || '-'}</td>
                        <td>{event.userBadge}</td>
                        <td>{event.notes || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
