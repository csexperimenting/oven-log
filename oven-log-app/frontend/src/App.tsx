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

interface ParsedBarcode {
  type: 'action' | 'oven' | 'app' | 'time' | 'trak' | 'unknown'
  value: string
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
  
  const [barcodeMode, setBarcodeMode] = useState(true)
  const [barcodeBuffer, setBarcodeBuffer] = useState('')
  const [barcodeHudMessage, setBarcodeHudMessage] = useState('')

  useEffect(() => {
    loadBoxes()
    loadApplications()
    loadEventsInOvens()
    const interval = setInterval(loadEventsInOvens, 30000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (!barcodeMode) {
      return
    }

    let commitTimer: number | null = null

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) {
        return
      }

      if (e.key === 'F5' || e.key === 'F12') {
        return
      }

      if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault()
        if (barcodeBuffer.trim()) {
          commitBarcodeBuffer(barcodeBuffer.trim())
          setBarcodeBuffer('')
        }
        if (commitTimer) {
          clearTimeout(commitTimer)
          commitTimer = null
        }
        return
      }

      if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault()
        const newBuffer = barcodeBuffer + e.key
        setBarcodeBuffer(newBuffer)
        
        const parsed = parseBarcodeToken(newBuffer, boxes, applications)
        setBarcodeHudMessage(`Buffer: "${newBuffer}" → ${parsed.type.toUpperCase()}: ${parsed.value}`)

        if (commitTimer) {
          clearTimeout(commitTimer)
        }
        commitTimer = setTimeout(() => {
          if (newBuffer.trim()) {
            commitBarcodeBuffer(newBuffer.trim())
            setBarcodeBuffer('')
            setBarcodeHudMessage('')
          }
        }, 300)
      }
    }

    window.addEventListener('keydown', handleKeyDown, { capture: true })

    return () => {
      window.removeEventListener('keydown', handleKeyDown, { capture: true })
      if (commitTimer) {
        clearTimeout(commitTimer)
      }
    }
  }, [barcodeMode, barcodeBuffer, boxes, applications])

  const parseBarcodeToken = (buffer: string, boxes: Box[], apps: Application[]): ParsedBarcode => {
    const trimmed = buffer.trim().toUpperCase()
    
    const actionMatch = trimmed.match(/^ACT:(ADD|REMOVE|RESET|OVENON)$/i)
    if (actionMatch) {
      return { type: 'action', value: actionMatch[1].toUpperCase() }
    }
    
    const ovenPrefixMatch = trimmed.match(/^OVEN:(.+)$/)
    if (ovenPrefixMatch) {
      return { type: 'oven', value: ovenPrefixMatch[1] }
    }
    
    const appPrefixMatch = trimmed.match(/^APP:(.+)$/)
    if (appPrefixMatch) {
      return { type: 'app', value: appPrefixMatch[1] }
    }
    
    const timePrefixMatch = trimmed.match(/^TIME:(\d{1,4})$/)
    if (timePrefixMatch) {
      return { type: 'time', value: timePrefixMatch[1] }
    }
    
    const naturalOvenMatch = trimmed.match(/^OVEN-\d{3}$/)
    if (naturalOvenMatch) {
      const box = boxes.find(b => b.toolNumber.toUpperCase() === trimmed)
      if (box) {
        return { type: 'oven', value: box.toolNumber }
      }
    }
    
    const naturalTimeMatch = trimmed.match(/^\d{1,4}$/)
    if (naturalTimeMatch) {
      return { type: 'time', value: trimmed }
    }
    
    const app = apps.find(a => a.name.toUpperCase() === trimmed)
    if (app) {
      return { type: 'app', value: app.name }
    }
    
    return { type: 'trak', value: buffer.trim() }
  }

  const commitBarcodeBuffer = (buffer: string) => {
    const parsed = parseBarcodeToken(buffer, boxes, applications)
    
    switch (parsed.type) {
      case 'action':
        handleBarcodeAction(parsed.value)
        setBarcodeHudMessage(`Action: ${parsed.value}`)
        break
      case 'oven':
        const box = boxes.find(b => b.toolNumber.toUpperCase() === parsed.value.toUpperCase())
        if (box) {
          setSelectedBox(box.id)
          setTemperature(box.defaultTemperature)
          setBarcodeHudMessage(`Selected Oven: ${box.toolNumber}`)
        } else {
          setBarcodeHudMessage(`Oven not found: ${parsed.value}`)
        }
        break
      case 'app':
        const app = applications.find(a => a.name.toUpperCase() === parsed.value.toUpperCase())
        if (app) {
          setSelectedApplication(app.id)
          if (app.defaultBakeTimeMinutes) {
            setBakeTime(app.defaultBakeTimeMinutes)
          }
          setBarcodeHudMessage(`Selected Application: ${app.name}`)
        } else {
          setBarcodeHudMessage(`Application not found: ${parsed.value}`)
        }
        break
      case 'time':
        const timeValue = parseInt(parsed.value, 10)
        if (!isNaN(timeValue) && timeValue > 0) {
          setBakeTime(timeValue)
          setBarcodeHudMessage(`Set Bake Time: ${timeValue} minutes`)
        }
        break
      case 'trak':
        const existing = trakList.find(t => t.trakId === parsed.value)
        if (!existing) {
          setTrakList([...trakList, {
            trakId: parsed.value,
            partNumber: `PART-${parsed.value}`,
            selected: true
          }])
          setBarcodeHudMessage(`Added TRAK: ${parsed.value}`)
        } else {
          setTrakList(trakList.map(t => 
            t.trakId === parsed.value ? { ...t, selected: !t.selected } : t
          ))
          setBarcodeHudMessage(`Toggled TRAK: ${parsed.value}`)
        }
        break
      default:
        setBarcodeHudMessage(`Unknown: ${buffer}`)
    }
    
    setTimeout(() => setBarcodeHudMessage(''), 3000)
  }

  const handleBarcodeAction = (action: string) => {
    switch (action) {
      case 'RESET':
        handleReset()
        break
      case 'ADD':
        const selectedTraks = trakList.filter(t => t.selected)
        if (selectedTraks.length === 0) {
          setError('No TRAKs selected. Add TRAKs to the list first.')
          setTimeout(() => setError(''), 3000)
          return
        }
        if (!selectedBox) {
          setError('No oven selected. Select an oven first.')
          setTimeout(() => setError(''), 3000)
          return
        }
        handleBatchAddToOven()
        break
      case 'REMOVE':
        const selectedEvents = eventsInOvens.filter(e => selectedEventsForHistory.includes(e.id))
        if (selectedEvents.length === 0) {
          setError('No TRAKs selected in oven list. Select TRAKs to remove first.')
          setTimeout(() => setError(''), 3000)
          return
        }
        selectedEvents.forEach(event => handleRemoveClick(event))
        break
      case 'OVENON':
        if (!selectedBox) {
          setError('No oven selected. Select an oven first.')
          setTimeout(() => setError(''), 3000)
          return
        }
        const box = boxes.find(b => b.id === selectedBox)
        if (!box?.warmUpTimeMinutes) {
          setError('This oven does not require warm-up tracking.')
          setTimeout(() => setError(''), 3000)
          return
        }
        setShowOvenOnModal(true)
        break
    }
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
        const errorText = await response.text()
        let errorMessage = 'Failed to log oven turn-on'
        try {
          const errorJson = JSON.parse(errorText)
          errorMessage = errorJson.message || errorJson.error || errorText
        } catch {
          errorMessage = errorText || errorMessage
        }
        throw new Error(errorMessage)
      }

      setMessage('Oven turn-on logged successfully')
      setShowOvenOnModal(false)
      setTimeout(() => setMessage(''), 3000)
    } catch (err: any) {
      setError(err.message || 'Failed to log oven turn-on')
      setShowOvenOnModal(false)
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
        <button 
          className={`btn ${barcodeMode ? 'btn-warning' : 'btn-success'}`}
          onClick={() => setBarcodeMode(!barcodeMode)}
          title={barcodeMode ? 'Click to unlock for manual entry' : 'Click to lock for barcode entry'}
        >
          {barcodeMode ? '🔒 Barcode Mode (Locked)' : '🔓 Manual Mode (Unlocked)'}
        </button>
      </header>

      {barcodeMode && barcodeHudMessage && (
        <div className="barcode-hud">
          {barcodeHudMessage}
        </div>
      )}

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
              <button 
                className="btn btn-secondary" 
                onClick={() => setShowOvenOnModal(true)}
                disabled={!selectedBox || !boxes.find(b => b.id === selectedBox)?.warmUpTimeMinutes}
                title={!selectedBox ? 'Select an oven first' : !boxes.find(b => b.id === selectedBox)?.warmUpTimeMinutes ? 'This oven does not require warm-up tracking' : 'Log oven turn-on'}
              >
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
