import { useState, useEffect } from 'react'
import './App.css'

const API_BASE = '/api'

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

interface TrakListItem {
  trakId: string
  partNumber: string
  selected: boolean
}

interface HistoryEvent {
  id: number
  trakId: string
  partNumber: string
  boxName: string
  location: string
  temperature: number
  applicationName?: string
  quantity: number
  ovenInTime: string
  ovenOutTime?: string
  plannedBakeTimeMinutes: number
  actualBakeTimeMinutes?: number
  notes?: string
}

function App() {
  const [trakId, setTrakId] = useState('')
  const [selectedBox, setSelectedBox] = useState<number | null>(null)
  const [selectedApplication, setSelectedApplication] = useState<number | null>(null)
  const [temperature, setTemperature] = useState(150)
  const [quantity, setQuantity] = useState(1)
  const [bakeTime, setBakeTime] = useState(60)
  const [notes, setNotes] = useState('')
  
  const [boxes, setBoxes] = useState<Box[]>([])
  const [applications, setApplications] = useState<Application[]>([])
  const [eventsInOvens, setEventsInOvens] = useState<EventInOven[]>([])
  const [trakList, setTrakList] = useState<TrakListItem[]>([])
  const [selectedEventsForHistory, setSelectedEventsForHistory] = useState<number[]>([])
  
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [showHistoryModal, setShowHistoryModal] = useState(false)
  const [historyEvents, setHistoryEvents] = useState<HistoryEvent[]>([])
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false)
  const [eventToRemove, setEventToRemove] = useState<EventInOven | null>(null)
  const [showOvenOnModal, setShowOvenOnModal] = useState(false)

  useEffect(() => {
    loadBoxes()
    loadApplications()
    loadEventsInOvens()
    const interval = setInterval(loadEventsInOvens, 30000)
    return () => clearInterval(interval)
  }, [])

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

  const handleTrakIdSubmit = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === 'Tab') {
      e.preventDefault()
      if (trakId.trim()) {
        const existing = trakList.find(t => t.trakId === trakId)
        if (!existing) {
          setTrakList([...trakList, {
            trakId: trakId.trim(),
            partNumber: `PART-${trakId.trim()}`,
            selected: true
          }])
        } else {
          setTrakList(trakList.map(t => 
            t.trakId === trakId ? { ...t, selected: !t.selected } : t
          ))
        }
        setTrakId('')
      }
    }
  }

  const toggleTrakSelection = (trakId: string) => {
    setTrakList(trakList.map(t => 
      t.trakId === trakId ? { ...t, selected: !t.selected } : t
    ))
  }

  const toggleAllTraks = () => {
    const allSelected = trakList.every(t => t.selected)
    setTrakList(trakList.map(t => ({ ...t, selected: !allSelected })))
  }

  const handleBatchAddToOven = async () => {
    const selectedTraks = trakList.filter(t => t.selected)
    
    if (selectedTraks.length === 0) {
      setError('Please select at least one TRAK')
      return
    }
    
    if (!selectedBox) {
      setError('Please select an oven')
      return
    }

    try {
      for (const trak of selectedTraks) {
        const response = await fetch(`${API_BASE}/traks/${trak.trakId}`)
        if (!response.ok) {
          await fetch(`${API_BASE}/traks`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              trakId: trak.trakId,
              partNumber: trak.partNumber,
              quantity
            })
          })
        }

        await fetch(`${API_BASE}/events`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            trakId: trak.trakId,
            boxId: selectedBox,
            applicationId: selectedApplication,
            temperature,
            quantity,
            plannedBakeTimeMinutes: bakeTime,
            notes
          })
        })
      }

      setMessage(`${selectedTraks.length} TRAK(s) added to oven successfully`)
      setTrakList(trakList.filter(t => !t.selected))
      setNotes('')
      loadEventsInOvens()
      setTimeout(() => setMessage(''), 3000)
    } catch (err: any) {
      setError(err.message)
      setTimeout(() => setError(''), 5000)
    }
  }

  const handleRemoveClick = (event: EventInOven) => {
    if (event.timeRemainingMinutes && event.timeRemainingMinutes > 0) {
      setEventToRemove(event)
      setShowRemoveConfirm(true)
    } else {
      handleRemoveFromOven(event.id)
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
      setShowRemoveConfirm(false)
      setEventToRemove(null)
      loadEventsInOvens()
      setTimeout(() => setMessage(''), 3000)
    } catch (err: any) {
      setError(err.message)
      setTimeout(() => setError(''), 5000)
    }
  }

  const handleShowHistory = async () => {
    const selectedTrakIds = [
      ...trakList.filter(t => t.selected).map(t => t.trakId),
      ...eventsInOvens.filter(e => selectedEventsForHistory.includes(e.id)).map(e => e.trakId)
    ]

    if (selectedTrakIds.length === 0) {
      setError('Please select at least one TRAK')
      return
    }

    try {
      const allHistory: HistoryEvent[] = []
      for (const trakId of selectedTrakIds) {
        const response = await fetch(`${API_BASE}/traks/${trakId}/history`)
        if (response.ok) {
          const data = await response.json()
          allHistory.push(...data)
        }
      }
      setHistoryEvents(allHistory)
      setShowHistoryModal(true)
    } catch (err) {
      setError('Failed to load history')
    }
  }

  const handleOvenOn = async () => {
    if (!selectedBox) {
      setError('Please select an oven')
      return
    }

    try {
      const response = await fetch(`${API_BASE}/boxes/${selectedBox}/turn-on`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          turnOnTime: new Date().toISOString()
        })
      })

      if (!response.ok) {
        throw new Error('Failed to log oven turn-on')
      }

      setMessage('Oven turn-on logged successfully')
      setShowOvenOnModal(false)
      setTimeout(() => setMessage(''), 3000)
    } catch (err: any) {
      setError(err.message || 'Failed to log oven turn-on')
      setTimeout(() => setError(''), 5000)
    }
  }

  const handleReset = () => {
    setTrakId('')
    setTrakList([])
    setSelectedBox(null)
    setSelectedApplication(null)
    setTemperature(150)
    setQuantity(1)
    setBakeTime(60)
    setNotes('')
    setSelectedEventsForHistory([])
    loadEventsInOvens()
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

  return (
    <div className="app">
      <header className="header">
        <h1>Oven Log</h1>
      </header>

      <div className="container">
        {message && <div className="message success">{message}</div>}
        {error && <div className="message error">{error}</div>}

        <div className="main-content">
          <div className="left-panel">
            <h2>Add TRAK to Oven</h2>
            
            <div className="form-group">
              <label>TRAK ID:</label>
              <input
                type="text"
                value={trakId}
                onChange={(e) => setTrakId(e.target.value)}
                onKeyDown={handleTrakIdSubmit}
                placeholder="Enter or scan TRAK ID (press Enter)"
              />
            </div>

            {trakList.length > 0 && (
              <div className="trak-list">
                <div className="trak-list-header">
                  <h3>TRAK List</h3>
                  <button className="btn btn-small" onClick={toggleAllTraks}>
                    ✓ Check All
                  </button>
                </div>
                <div className="trak-list-items">
                  {trakList.map(trak => (
                    <div 
                      key={trak.trakId} 
                      className={`trak-item ${trak.selected ? 'selected' : ''}`}
                      onClick={() => toggleTrakSelection(trak.trakId)}
                    >
                      <input 
                        type="checkbox" 
                        checked={trak.selected}
                        onChange={() => {}}
                      />
                      <span>{trak.trakId}</span>
                      <span className="part-number">{trak.partNumber}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

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

            <div className="button-group">
              <button className="btn btn-primary" onClick={handleBatchAddToOven}>
                Add to Oven
              </button>
              <button className="btn btn-secondary" onClick={handleReset}>
                Reset
              </button>
              <button className="btn btn-secondary" onClick={handleShowHistory}>
                History
              </button>
              <button className="btn btn-secondary" onClick={() => setShowOvenOnModal(true)}>
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
                    <th>Select</th>
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
                      <td colSpan={11} style={{ textAlign: 'center' }}>No TRAKs in ovens</td>
                    </tr>
                  ) : (
                    eventsInOvens.map(event => (
                      <tr key={event.id}>
                        <td>
                          <input 
                            type="checkbox"
                            checked={selectedEventsForHistory.includes(event.id)}
                            onChange={() => {
                              if (selectedEventsForHistory.includes(event.id)) {
                                setSelectedEventsForHistory(selectedEventsForHistory.filter(id => id !== event.id))
                              } else {
                                setSelectedEventsForHistory([...selectedEventsForHistory, event.id])
                              }
                            }}
                          />
                        </td>
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
                            onClick={() => handleRemoveClick(event)}
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

      {showHistoryModal && (
        <div className="modal-overlay" onClick={() => setShowHistoryModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>TRAK History</h2>
              <button className="close-btn" onClick={() => setShowHistoryModal(false)}>×</button>
            </div>
            <div className="modal-body">
              {historyEvents.length === 0 ? (
                <p>No history found for selected TRAKs</p>
              ) : (
                <table>
                  <thead>
                    <tr>
                      <th>TRAK ID</th>
                      <th>Part Number</th>
                      <th>Oven</th>
                      <th>Location</th>
                      <th>Temp</th>
                      <th>App</th>
                      <th>Qty</th>
                      <th>In Time</th>
                      <th>Out Time</th>
                      <th>Planned (min)</th>
                      <th>Actual (min)</th>
                      <th>Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {historyEvents.map((event, idx) => (
                      <tr key={idx}>
                        <td>{event.trakId}</td>
                        <td>{event.partNumber}</td>
                        <td>{event.boxName}</td>
                        <td>{event.location}</td>
                        <td>{event.temperature}</td>
                        <td>{event.applicationName || '-'}</td>
                        <td>{event.quantity}</td>
                        <td>{formatDateTime(event.ovenInTime)}</td>
                        <td>{event.ovenOutTime ? formatDateTime(event.ovenOutTime) : 'In Oven'}</td>
                        <td>{event.plannedBakeTimeMinutes}</td>
                        <td>{event.actualBakeTimeMinutes || '-'}</td>
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

      {showRemoveConfirm && eventToRemove && (
        <div className="modal-overlay" onClick={() => setShowRemoveConfirm(false)}>
          <div className="modal confirm-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Confirm Removal</h2>
            </div>
            <div className="modal-body">
              <p>TRAK <strong>{eventToRemove.trakId}</strong> still has <strong>{formatTimeRemaining(eventToRemove.timeRemainingMinutes)}</strong> remaining.</p>
              <p>Are you sure you want to remove it from the oven prematurely?</p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowRemoveConfirm(false)}>
                Cancel
              </button>
              <button className="btn btn-danger" onClick={() => handleRemoveFromOven(eventToRemove.id)}>
                Yes, Remove
              </button>
            </div>
          </div>
        </div>
      )}

      {showOvenOnModal && (
        <div className="modal-overlay" onClick={() => setShowOvenOnModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Log Oven Turn-On</h2>
              <button className="close-btn" onClick={() => setShowOvenOnModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <p>Select an oven and click "Log Turn-On" to record when the oven was turned on.</p>
              <p>This is used for ovens without digital temperature displays that require a warm-up period.</p>
              <div className="form-group">
                <label>Selected Oven:</label>
                <p><strong>{selectedBox ? boxes.find(b => b.id === selectedBox)?.toolNumber : 'None'}</strong></p>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowOvenOnModal(false)}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={handleOvenOn} disabled={!selectedBox}>
                Log Turn-On
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
