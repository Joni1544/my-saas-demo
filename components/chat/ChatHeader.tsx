/**
 * Chat Header Component
 * Zeigt Chat-Info und Actions (Settings, Members, etc.)
 */
'use client'

import { Settings, Users, MoreVertical } from 'lucide-react'
import { useState } from 'react'

interface ChatHeaderProps {
  title: string
  subtitle?: string
  isChannel?: boolean
  channelId?: string
  onSettingsClick?: () => void
  onMembersClick?: () => void
}

export default function ChatHeader({
  title,
  subtitle,
  isChannel = false,
  channelId,
  onSettingsClick,
  onMembersClick,
}: ChatHeaderProps) {
  const [showMenu, setShowMenu] = useState(false)

  return (
    <div className="flex h-16 items-center justify-between border-b border-gray-200 bg-white px-6">
      <div className="flex-1 min-w-0">
        <h2 className="text-lg font-semibold text-gray-900 truncate">{title}</h2>
        {subtitle && <p className="text-sm text-gray-500 truncate">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-2">
        {isChannel && channelId && (
          <>
            {onMembersClick && (
              <button
                onClick={onMembersClick}
                className="rounded-md p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
                aria-label="Mitglieder anzeigen"
              >
                <Users className="h-5 w-5" />
              </button>
            )}
            {onSettingsClick && (
              <button
                onClick={onSettingsClick}
                className="rounded-md p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
                aria-label="Channel-Einstellungen"
              >
                <Settings className="h-5 w-5" />
              </button>
            )}
          </>
        )}
      </div>
    </div>
  )
}

