/**
 * Chat-Seite - Komplett überarbeitet
 * Modulares Chat-System mit Teamchat, Channels und Direktnachrichten
 */
'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import ChatSidebar from '@/components/chat/ChatSidebar'
import ChatMessages from '@/components/chat/ChatMessages'
import ChatInput from '@/components/chat/ChatInput'
import ChatHeader from '@/components/chat/ChatHeader'
import ChannelSettingsModal from '@/components/chat/ChannelSettingsModal'

interface User {
  id: string
  name: string | null
  email: string
}

interface Channel {
  id: string
  name: string
  description: string | null
  isSystem: boolean
  _count: {
    messages: number
    members: number
  }
}

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

interface ChannelWithMembers extends Channel {
  members: Array<{
    id: string
    user: User
    joinedAt: string
  }>
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
  const [showChannelSettings, setShowChannelSettings] = useState(false)
  const [selectedChannel, setSelectedChannel] = useState<ChannelWithMembers | null>(null)
  const [newChannelName, setNewChannelName] = useState('')
  const [newChannelDescription, setNewChannelDescription] = useState('')

  // Fetch Users
  const fetchUsers = useCallback(async () => {
    try {
      const response = await fetch('/api/chat/users')
      if (response.ok) {
        const data = await response.json()
        setUsers(data.users || [])
      }
    } catch (error) {
      console.error('Fehler beim Laden der Mitarbeiter:', error)
    }
  }, [])

  // Fetch Channels
  const fetchChannels = useCallback(async () => {
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
  }, [])

  // Fetch Messages
  const fetchMessages = useCallback(async () => {
    if (!selectedUserId && !selectedChannelId) return

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

  // Fetch Channel Details (für Settings)
  const fetchChannelDetails = useCallback(async (channelId: string) => {
    try {
      const response = await fetch(`/api/chat/channels/${channelId}`)
      if (response.ok) {
        const data = await response.json()
        setSelectedChannel(data.channel)
      }
    } catch (error) {
      console.error('Fehler beim Laden der Channel-Details:', error)
    }
  }, [])

  // Initial Load
  useEffect(() => {
    fetchUsers()
    fetchChannels()
  }, [fetchUsers, fetchChannels])

  // Fetch Messages when selection changes
  useEffect(() => {
    if (selectedUserId || selectedChannelId) {
      fetchMessages()
      // Polling alle 2 Sekunden für Realtime-Updates
      const interval = setInterval(fetchMessages, 2000)
      return () => clearInterval(interval)
    }
  }, [selectedUserId, selectedChannelId, fetchMessages])

  // Handle Send Message
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

  // Handle Create Channel
  const handleCreateChannel = async () => {
    if (!newChannelName.trim()) return

    try {
      const response = await fetch('/api/chat/channels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newChannelName.trim(),
          description: newChannelDescription.trim() || null,
        }),
      })

      if (response.ok) {
        setNewChannelName('')
        setNewChannelDescription('')
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

  // Handle Select User (Private Chat)
  const handleSelectUser = (userId: string) => {
    setSelectedUserId(userId)
    setSelectedChannelId(null)
  }

  // Handle Select Channel
  const handleSelectChannel = (channelId: string) => {
    setSelectedChannelId(channelId)
    setSelectedUserId(null)
  }

  // Handle Channel Settings
  const handleOpenChannelSettings = async () => {
    if (selectedChannelId) {
      await fetchChannelDetails(selectedChannelId)
      setShowChannelSettings(true)
    }
  }

  const handleCloseChannelSettings = () => {
    setShowChannelSettings(false)
    setSelectedChannel(null)
  }

  const handleChannelSettingsUpdate = () => {
    fetchChannels()
    if (selectedChannelId) {
      fetchChannelDetails(selectedChannelId)
    }
  }

  // Get current chat title and subtitle
  const getChatTitle = () => {
    if (selectedUserId) {
      const user = users.find((u) => u.id === selectedUserId)
      return user?.name || user?.email.split('@')[0] || 'Unbekannt'
    }
    if (selectedChannelId) {
      const channel = channels.find((c) => c.id === selectedChannelId)
      return channel?.name || 'Unbekannt'
    }
    return ''
  }

  const getChatSubtitle = () => {
    if (selectedUserId) {
      const user = users.find((u) => u.id === selectedUserId)
      return user?.email || ''
    }
    if (selectedChannelId) {
      const channel = channels.find((c) => c.id === selectedChannelId)
      return channel?.description || `${channel?._count.members || 0} Mitglieder`
    }
    return ''
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] bg-gray-50">
      {/* Sidebar */}
      <ChatSidebar
        users={users}
        channels={channels}
        selectedUserId={selectedUserId}
        selectedChannelId={selectedChannelId}
        currentUserId={session?.user?.id}
        onSelectUser={handleSelectUser}
        onSelectChannel={handleSelectChannel}
        onCreateChannel={() => setShowCreateChannel(true)}
      />

      {/* Main Chat Area */}
      <div className="flex flex-1 flex-col bg-white">
        {selectedUserId || selectedChannelId ? (
          <>
            {/* Header */}
            <ChatHeader
              title={getChatTitle()}
              subtitle={getChatSubtitle()}
              isChannel={!!selectedChannelId}
              channelId={selectedChannelId || undefined}
              onSettingsClick={handleOpenChannelSettings}
            />

            {/* Messages */}
            <div className="flex-1 overflow-hidden">
              <ChatMessages messages={messages} loading={loading} />
            </div>

            {/* Input */}
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

      {/* Create Channel Modal */}
      {showCreateChannel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="w-full max-w-md rounded-lg bg-white shadow-xl p-6">
            <h2 className="mb-4 text-xl font-semibold text-gray-900">Neuer Channel</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Name *</label>
                <input
                  type="text"
                  value={newChannelName}
                  onChange={(e) => setNewChannelName(e.target.value)}
                  placeholder="z.B. Projekt Alpha"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleCreateChannel()
                    }
                  }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Beschreibung</label>
                <textarea
                  value={newChannelDescription}
                  onChange={(e) => setNewChannelDescription(e.target.value)}
                  placeholder="Optionale Beschreibung..."
                  rows={3}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowCreateChannel(false)
                    setNewChannelName('')
                    setNewChannelDescription('')
                  }}
                  className="flex-1 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Abbrechen
                </button>
                <button
                  onClick={handleCreateChannel}
                  disabled={!newChannelName.trim()}
                  className="flex-1 rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
                >
                  Erstellen
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Channel Settings Modal */}
      {showChannelSettings && selectedChannel && (
        <ChannelSettingsModal
          isOpen={showChannelSettings}
          channel={selectedChannel}
          allUsers={users}
          currentUserId={session?.user?.id}
          onClose={handleCloseChannelSettings}
          onUpdate={handleChannelSettingsUpdate}
        />
      )}
    </div>
  )
}
