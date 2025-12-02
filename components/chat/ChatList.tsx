/**
 * Chat List Component
 * Liste aller Chats (Mitarbeiter & Channels)
 */
'use client'

import { format } from 'date-fns'

interface User {
  id: string
  name: string | null
  email: string
}

interface Channel {
  id: string
  name: string
  messages: Array<{
    id: string
    content: string
    createdAt: string
    sender: {
      name: string | null
      email: string
    }
  }>
  _count: {
    messages: number
  }
}

interface ChatListProps {
  users: User[]
  channels: Channel[]
  selectedUserId?: string | null
  selectedChannelId?: string | null
  onSelectUser: (userId: string) => void
  onSelectChannel: (channelId: string) => void
  currentUserId?: string
}

export default function ChatList({
  users,
  channels,
  selectedUserId,
  selectedChannelId,
  onSelectUser,
  onSelectChannel,
  currentUserId,
}: ChatListProps) {
  return (
    <div className="flex h-full flex-col border-r border-gray-200 bg-white">
      <div className="border-b border-gray-200 p-4">
        <h2 className="text-lg font-semibold text-gray-900">Chats</h2>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Channels */}
        {channels.length > 0 && (
          <div className="border-b border-gray-200 p-4">
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500">Channels</h3>
            <div className="space-y-1">
              {channels.map((channel) => {
                const isSelected = selectedChannelId === channel.id
                const lastMessage = channel.messages[0]

                return (
                  <button
                    key={channel.id}
                    onClick={() => onSelectChannel(channel.id)}
                    className={`w-full rounded-lg p-3 text-left transition-colors ${
                      isSelected
                        ? 'bg-indigo-50 text-indigo-900'
                        : 'hover:bg-gray-50 text-gray-900'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 text-indigo-600 font-semibold">
                        #
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{channel.name}</p>
                        {lastMessage && (
                          <p className="text-xs text-gray-500 truncate">
                            {lastMessage.sender.name || lastMessage.sender.email.split('@')[0]}: {lastMessage.content}
                          </p>
                        )}
                        {!lastMessage && (
                          <p className="text-xs text-gray-400">Keine Nachrichten</p>
                        )}
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Mitarbeiter */}
        <div className="p-4">
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500">Mitarbeiter</h3>
          <div className="space-y-1">
            {users
              .filter((user) => user.id !== currentUserId)
              .map((user) => {
                const isSelected = selectedUserId === user.id
                const userName = user.name || user.email.split('@')[0]

                return (
                  <button
                    key={user.id}
                    onClick={() => onSelectUser(user.id)}
                    className={`w-full rounded-lg p-3 text-left transition-colors ${
                      isSelected
                        ? 'bg-indigo-50 text-indigo-900'
                        : 'hover:bg-gray-50 text-gray-900'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-500 text-white font-semibold">
                        {userName.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{userName}</p>
                        <p className="text-xs text-gray-500 truncate">{user.email}</p>
                      </div>
                    </div>
                  </button>
                )
              })}
          </div>
        </div>
      </div>
    </div>
  )
}

