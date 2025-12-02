/**
 * Chat-Seite
 * Hauptseite für die Chat-Funktion
 */
'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import ChatList from '@/components/chat/ChatList'
import ChatWindow from '@/components/chat/ChatWindow'
import ChatInput from '@/components/chat/ChatInput'

interface Message {
  id: string
  content: string
  createdAt: string
  read: boolean
  sender: {
    id: string
    name: string | null
    email: string
  }
  receiver?: {
    id: string
    name: string | null
    email: string
  } | null
}

interface User {
  id: string
  name: string | null
  email: string
}

interface ChannelMessage {
  id: string
  content: string
  createdAt: string
  sender: {
    name: string | null
    email: string
  }
}

interface Channel {
  id: string
  name: string
  messages: ChannelMessage[]
  _count: {
    messages: number
  }
}

interface Employee {
  user: {
    id: string
    name: string | null
    email: string
  }
}

export default function ChatPage() {
  const { data: session } = useSession()
  const [users, setUsers] = useState<User[]>([])
  const [channels, setChannels] = useState<Channel[]>([])
  const [messages, setMessages] = useState<Message[]>([])
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  const [selectedChannelId, setSelectedChannelId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [showCreateChannel, setShowCreateChannel] = useState(false)
  const [newChannelName, setNewChannelName] = useState('')

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/chat/users')
      if (response.ok) {
        const data = await response.json()
        setUsers(data.users || [])
      }
    } catch (error) {
      console.error('Fehler beim Laden der Mitarbeiter:', error)
    }
  }

  const fetchChannels = async () => {
    try {
      const response = await fetch('/api/chat/channels')
      if (response.ok) {
        const data = await response.json()
        setChannels(data.channels || [])
      }
    } catch (error) {
      console.error('Fehler beim Laden der Channels:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchMessages = useCallback(async () => {
    try {
      const params = new URLSearchParams()
      if (selectedUserId) {
        params.append('userId', selectedUserId)
      }
      if (selectedChannelId) {
        params.append('channelId', selectedChannelId)
      }

      const response = await fetch(`/api/chat/messages?${params.toString()}`)
      if (response.ok) {
        const data = await response.json()
        setMessages(data.messages || [])
      }
    } catch (error) {
      console.error('Fehler beim Laden der Nachrichten:', error)
    }
  }, [selectedUserId, selectedChannelId])

  useEffect(() => {
    fetchUsers()
    fetchChannels()
  }, [])

  useEffect(() => {
    if (selectedUserId || selectedChannelId) {
      fetchMessages()
      // Polling alle 2 Sekunden
      const interval = setInterval(fetchMessages, 2000)
      return () => clearInterval(interval)
    }
  }, [selectedUserId, selectedChannelId, fetchMessages])

  const handleSend = async (content: string) => {
    if (!content.trim()) return

    setSending(true)
    try {
      const response = await fetch('/api/chat/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          receiverId: selectedUserId || null,
          channelId: selectedChannelId || null,
          content,
        }),
      })

      if (response.ok) {
        fetchMessages()
      } else {
        const error = await response.json()
        alert(error.error || 'Fehler beim Senden')
      }
    } catch (error) {
      console.error('Fehler beim Senden:', error)
      alert('Fehler beim Senden der Nachricht')
    } finally {
      setSending(false)
    }
  }

  const handleCreateChannel = async () => {
    if (!newChannelName.trim()) return

    try {
      const response = await fetch('/api/chat/channels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newChannelName.trim() }),
      })

      if (response.ok) {
        setNewChannelName('')
        setShowCreateChannel(false)
        fetchChannels()
      } else {
        const error = await response.json()
        alert(error.error || 'Fehler beim Erstellen')
      }
    } catch (error) {
      console.error('Fehler beim Erstellen:', error)
      alert('Fehler beim Erstellen des Channels')
    }
  }

  const handleSelectUser = (userId: string) => {
    setSelectedUserId(userId)
    setSelectedChannelId(null)
  }

  const handleSelectChannel = (channelId: string) => {
    setSelectedChannelId(channelId)
    setSelectedUserId(null)
  }

  const isAdmin = session?.user?.role === 'ADMIN'

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex h-[calc(100vh-4rem)]">
      {/* Sidebar */}
      <div className="w-80 flex-shrink-0">
        <ChatList
          users={users}
          channels={channels}
          selectedUserId={selectedUserId}
          selectedChannelId={selectedChannelId}
          onSelectUser={handleSelectUser}
          onSelectChannel={handleSelectChannel}
          currentUserId={session?.user?.id}
        />
        {isAdmin && (
          <div className="border-t border-gray-200 bg-white p-4">
            {showCreateChannel ? (
              <div className="space-y-2">
                <input
                  type="text"
                  value={newChannelName}
                  onChange={(e) => setNewChannelName(e.target.value)}
                  placeholder="Channel-Name"
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleCreateChannel()
                    }
                  }}
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleCreateChannel}
                    className="flex-1 rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-500"
                  >
                    Erstellen
                  </button>
                  <button
                    onClick={() => {
                      setShowCreateChannel(false)
                      setNewChannelName('')
                    }}
                    className="flex-1 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Abbrechen
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowCreateChannel(true)}
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                + Channel erstellen
              </button>
            )}
          </div>
        )}
      </div>

      {/* Chat Window */}
      <div className="flex flex-1 flex-col bg-white">
        {selectedUserId || selectedChannelId ? (
          <>
            <div className="border-b border-gray-200 bg-white p-4">
              <h2 className="text-lg font-semibold text-gray-900">
                {selectedUserId
                  ? users.find((u) => u.id === selectedUserId)?.name ||
                    users.find((u) => u.id === selectedUserId)?.email.split('@')[0]
                  : channels.find((c) => c.id === selectedChannelId)?.name}
              </h2>
            </div>
            <div className="flex-1 overflow-hidden">
              <ChatWindow messages={messages} loading={loading} />
            </div>
            <ChatInput onSend={handleSend} disabled={sending} />
          </>
        ) : (
          <div className="flex h-full items-center justify-center">
            <div className="text-center">
              <p className="text-lg font-medium text-gray-900">Wähle einen Chat aus</p>
              <p className="mt-2 text-sm text-gray-500">
                Wähle einen Mitarbeiter oder Channel aus der Liste aus, um zu beginnen
              </p>
            </div>
          </div>
        )}
      </div>
      </div>
    </div>
  )
}

