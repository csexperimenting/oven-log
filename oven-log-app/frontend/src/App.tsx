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
  const [selectedEvents, setSelectedEvents] = useState<number[]>([])
  
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

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

  const handleAddToOven = async () => {
    if (!trakId || !selectedBox) {
      setError('TRAK ID and Oven are required')
      return
    }

    try {
      const response = await fetch(`${API_BASE}/traks/${trakId}`)
      if (!response.ok) {
        const createResponse = await fetch(`${API_BASE}/traks`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            trakId,
            partNumber: `PART-${trakId}`,
            quantity
          })
        })
        if (!createResponse.ok) {
          throw new Error('Failed to create TRAK')
        }
      }

      const eventResponse = await fetch(`${API_BASE}/events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          trakId,
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

      setMessage('TRAK added to oven successfully')
      setTrakId('')
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
                placeholder="Enter or scan TRAK ID"
              />
            </div>

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

            <button className="btn btn-primary" onClick={handleAddToOven}>
              Add to Oven
            </button>

            <button className="btn btn-secondary" onClick={() => {
              setTrakId('')
              setSelectedBox(null)
              setSelectedApplication(null)
              setTemperature(150)
              setQuantity(1)
              setBakeTime(60)
              setNotes('')
            }}>
              Reset
            </button>
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
    </div>
  )
}

export default App
