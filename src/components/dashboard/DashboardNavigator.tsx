'use client'

import React from 'react'
import { LayoutDashboard, Bot, ChevronLeft, ChevronRight } from 'lucide-react'

export type DashboardView = 'ai-agents-analytics' | 'codegenie-dashboard'

interface NavItem {
  id: DashboardView
  label: string
  icon: React.ElementType
  description: string
}

const NAV_ITEMS: NavItem[] = [
  {
    id: 'ai-agents-analytics',
    label: 'AI Agents Analytics',
    icon: Bot,
    description: 'AI agent performance & adoption metrics',
  },
  {
    id: 'codegenie-dashboard',
    label: 'CodeGenie Dashboard',
    icon: LayoutDashboard,
    description: 'CodeGenie adoption analytics',
  },
]

interface DashboardNavigatorProps {
  activeView: DashboardView
  onViewChange: (view: DashboardView) => void
  collapsed: boolean
  onToggleCollapse: () => void
}

export function DashboardNavigator({
  activeView,
  onViewChange,
  collapsed,
  onToggleCollapse,
}: DashboardNavigatorProps) {
  return (
    <aside
      className={`dashboard-navigator ${collapsed ? 'collapsed' : 'expanded'}`}
      aria-label="Dashboard Navigation"
    >
      {/* Sidebar Header */}
      <div className="nav-header">
        {!collapsed && (
          <div className="nav-brand">
            <img
              src="https://app.ktern.com/codegenie/frontend/_next/static/media/KTern.d14aee5e.png"
              alt="KTern Logo"
              className="nav-logo"
            />
            {/* <span className="nav-brand-text">KTern.AI</span> */}
          </div>
        )}
        <button
          onClick={onToggleCollapse}
          className="collapse-btn"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? (
            <ChevronRight className="collapse-icon" />
          ) : (
            <ChevronLeft className="collapse-icon" />
          )}
        </button>
      </div>

      {/* Divider */}
      <div className="nav-divider" />

      {/* Navigation Items */}
      <nav className="nav-items" aria-label="Dashboard sections">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon
          const isActive = activeView === item.id
          return (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id)}
              className={`nav-item ${isActive ? 'active' : ''}`}
              title={collapsed ? item.label : undefined}
              aria-current={isActive ? 'page' : undefined}
            >
              <Icon className="nav-item-icon" aria-hidden="true" />
              {!collapsed && (
                <div className="nav-item-text">
                  <span className="nav-item-label">{item.label}</span>
                  <span className="nav-item-desc">{item.description}</span>
                </div>
              )}
              {isActive && <div className="nav-active-indicator" aria-hidden="true" />}
            </button>
          )
        })}
      </nav>

      {/* Footer */}
      {!collapsed && (
        <div className="nav-footer">
          <span className="nav-footer-text">Analytics Platform</span>
        </div>
      )}
    </aside>
  )
}
