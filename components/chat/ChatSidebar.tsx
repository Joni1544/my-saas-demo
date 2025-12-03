/**
 * Chat Sidebar Component
 * Zeigt Teamchat, Channels und Direktnachrichten
 */
'use client'

import { useState } from 'react'
import { Search, Hash, Plus } from 'lucide-react'

interface User {
  id: string
  name: string | null
  email: string
}

interface Channel {
  id: string
  name: string
  isSystem: boolean
  description?: string | null
  _count: {
    messages: number
    members: number
  }
}

interface ChatSidebarProps {
  users: User[]
  channels: Channel[]
  selectedUserId: string | null
  selectedChannelId: string | null
  currentUserId: string | undefined
  onSelectUser: (userId: string) => void
  onSelectChannel: (channelId: string) => void
  onCreateChannel: () => void
}

export default function ChatSidebar({
  users,
  channels,
  selectedUserId,
  selectedChannelId,
  currentUserId,
  onSelectUser,
  onSelectChannel,
  onCreateChannel,
}: ChatSidebarProps) {
  const [searchQuery, setSearchQuery] = useState('')

  // Trenne System-Channel (Teamchat) von normalen Channels
  // Teamchat ist IMMER sichtbar, auch bei Suche
  const teamchat = channels.find((c) => c.isSystem)
  
  // Filtere normale Channels basierend auf Suche
  const regularChannels = channels
    .filter((c) => !c.isSystem)
    .filter((channel) =>
      searchQuery ? channel.name.toLowerCase().includes(searchQuery.toLowerCase()) : true
    )
    .sort((a, b) => a.name.localeCompare(b.name))

  // Filtere Users basierend auf Suche
  const filteredUsers = users.filter(
    (user) =>
      user.id !== currentUserId &&
      (user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  return (
    <div className="flex h-full w-80 flex-col border-r border-gray-200 bg-white">
      {/* Header */}
      <div className="border-b border-gray-200 p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Chats</h2>
          <button
            onClick={onCreateChannel}
            className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
            aria-label="Channel erstellen"
          >
            <Plus className="h-5 w-5" />
          </button>
        </div>
        {/* Suche */}
        <div className="flex items-center gap-2">
          <Search className="h-4 w-4 text-gray-400 flex-shrink-0" />
          <input
            type="text"
            placeholder="Suchen..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 rounded-lg border border-gray-300 bg-gray-50 py-2 px-3 text-sm text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-colors"
          />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Teamchat - IMMER sichtbar und hervorgehoben */}
        {teamchat && (
          <div className="p-2 border-b border-gray-200">
            <button
              onClick={() => onSelectChannel(teamchat.id)}
              className={`w-full flex items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors ${
                selectedChannelId === teamchat.id
                  ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                  : 'text-gray-700 hover:bg-gray-50 border border-transparent'
              }`}
            >
              <div className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded bg-indigo-100 text-indigo-600">
                <Hash className="h-3.5 w-3.5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold truncate">{teamchat.name}</p>
                {teamchat.description && (
                  <p className="text-xs text-gray-500 truncate">{teamchat.description}</p>
                )}
              </div>
            </button>
          </div>
        )}

        {/* Channels */}
        {regularChannels.length > 0 && (
          <div className="border-t border-gray-200 p-2">
            <div className="mb-2 px-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500">Channels</h3>
            </div>
            <div className="space-y-1">
              {regularChannels.map((channel) => (
                <button
                  key={channel.id}
                  onClick={() => onSelectChannel(channel.id)}
                  className={`w-full flex items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors ${
                    selectedChannelId === channel.id
                      ? 'bg-indigo-50 text-indigo-700'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Hash className="h-5 w-5 flex-shrink-0 text-gray-400" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{channel.name}</p>
                    {channel.description && (
                      <p className="text-xs text-gray-500 truncate">{channel.description}</p>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Direktnachrichten */}
        {filteredUsers.length > 0 && (
          <div className="border-t border-gray-200 p-2">
            <div className="mb-2 px-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500">Direktnachrichten</h3>
            </div>
            <div className="space-y-1">
              {filteredUsers.map((user) => {
                const userName = user.name || user.email.split('@')[0]
                const initials = userName
                  .split(' ')
                  .map((n) => n[0])
                  .join('')
                  .toUpperCase()
                  .slice(0, 2)

                return (
                  <button
                    key={user.id}
                    onClick={() => onSelectUser(user.id)}
                    className={`w-full flex items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors ${
                      selectedUserId === user.id
                        ? 'bg-indigo-50 text-indigo-700'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-indigo-500 text-xs font-semibold text-white">
                      {initials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{userName}</p>
                      <p className="text-xs text-gray-500 truncate">{user.email}</p>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {regularChannels.length === 0 && filteredUsers.length === 0 && searchQuery && (
          <div className="p-4 text-center text-sm text-gray-500">Keine Ergebnisse gefunden</div>
        )}
      </div>
    </div>
  )
}

