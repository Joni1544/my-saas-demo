/**
 * Chat Window Component
 * Zeigt Chat-Nachrichten an
 */
'use client'

import { useEffect, useRef } from 'react'
import { format } from 'date-fns'
import { useSession } from 'next-auth/react'

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

interface ChatWindowProps {
  messages: Message[]
  loading?: boolean
}

export default function ChatWindow({ messages, loading = false }: ChatWindowProps) {
  const { data: session } = useSession()
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Auto-Scroll to bottom
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-gray-500">Lade Nachrichten...</p>
      </div>
    )
  }

  if (messages.length === 0) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-gray-400">Noch keine Nachrichten. Starte die Unterhaltung!</p>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col overflow-y-auto bg-gray-50 p-4">
      <div className="space-y-4">
        {messages.map((message) => {
          const isOwn = message.sender.id === session?.user?.id
          const senderName = message.sender.name || message.sender.email.split('@')[0]

          return (
            <div
              key={message.id}
              className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`flex max-w-[70%] flex-col ${isOwn ? 'items-end' : 'items-start'}`}>
                {!isOwn && (
                  <span className="mb-1 text-xs font-medium text-gray-600">{senderName}</span>
                )}
                <div
                  className={`rounded-2xl px-4 py-2 ${
                    isOwn
                      ? 'bg-indigo-600 text-white'
                      : 'bg-white text-gray-900 shadow-sm border border-gray-200'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
                </div>
                <div className={`mt-1 flex items-center gap-2 ${isOwn ? 'flex-row-reverse' : ''}`}>
                  <span className="text-xs text-gray-400">
                    {format(new Date(message.createdAt), 'HH:mm')}
                  </span>
                  {isOwn && (
                    <span className={`text-xs ${message.read ? 'text-indigo-600' : 'text-gray-400'}`}>
                      {message.read ? '✓✓' : '✓'}
                    </span>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
      <div ref={messagesEndRef} />
    </div>
  )
}

