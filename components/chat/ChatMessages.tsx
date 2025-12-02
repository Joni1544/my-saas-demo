/**
 * Chat Messages Component
 * Zeigt Nachrichtenverlauf mit modernem Design
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

interface ChatMessagesProps {
  messages: Message[]
  loading?: boolean
}

export default function ChatMessages({ messages, loading = false }: ChatMessagesProps) {
  const { data: session } = useSession()
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Auto-Scroll to bottom
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
          <p className="mt-2 text-sm text-gray-500">Lade Nachrichten...</p>
        </div>
      </div>
    )
  }

  if (messages.length === 0) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <p className="text-lg font-medium text-gray-900">Noch keine Nachrichten</p>
          <p className="mt-1 text-sm text-gray-500">Starte die Unterhaltung!</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col overflow-y-auto bg-gray-50 p-6">
      <div className="space-y-4">
        {messages.map((message, index) => {
          const isOwn = message.sender.id === session?.user?.id
          const senderName = message.sender.name || message.sender.email.split('@')[0]
          const prevMessage = index > 0 ? messages[index - 1] : null
          const showAvatar = !prevMessage || prevMessage.sender.id !== message.sender.id
          const showDate =
            !prevMessage ||
            new Date(message.createdAt).getDate() !== new Date(prevMessage.createdAt).getDate()

          return (
            <div key={message.id}>
              {showDate && (
                <div className="my-4 flex items-center justify-center">
                  <div className="rounded-full bg-gray-200 px-3 py-1">
                    <span className="text-xs font-medium text-gray-600">
                      {format(new Date(message.createdAt), 'EEEE, d. MMMM yyyy')}
                    </span>
                  </div>
                </div>
              )}

              <div className={`flex gap-3 ${isOwn ? 'flex-row-reverse' : ''}`}>
                {showAvatar && !isOwn && (
                  <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-indigo-500 text-xs font-semibold text-white">
                    {senderName.charAt(0).toUpperCase()}
                  </div>
                )}
                {showAvatar && isOwn && <div className="w-8" />}

                <div className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'} max-w-[70%]`}>
                  {showAvatar && !isOwn && (
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
            </div>
          )
        })}
      </div>
      <div ref={messagesEndRef} />
    </div>
  )
}

