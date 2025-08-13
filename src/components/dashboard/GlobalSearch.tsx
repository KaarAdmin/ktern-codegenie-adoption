'use client'

import React, { useState, useCallback, useRef, useEffect } from 'react'
import { Search, X, Filter, Clock, TrendingUp } from 'lucide-react'

interface GlobalSearchProps {
  onSearchChange: (searchTerm: string) => void
  onClearSearch: () => void
  placeholder?: string
  className?: string
  searchTerm?: string
  showSuggestions?: boolean
}

interface SearchHistoryItem {
  term: string
  timestamp: number
  frequency: number
}

export function GlobalSearch({
  onSearchChange,
  onClearSearch,
  placeholder = "Search across all data...",
  className = '',
  searchTerm = '',
  showSuggestions = true
}: GlobalSearchProps) {
  const [localSearchTerm, setLocalSearchTerm] = useState(searchTerm)
  const [isFocused, setIsFocused] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const [searchHistory, setSearchHistory] = useState<SearchHistoryItem[]>([])
  const inputRef = useRef<HTMLInputElement>(null)
  const debounceRef = useRef<NodeJS.Timeout>()
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Load search history from localStorage
  useEffect(() => {
    const savedHistory = localStorage.getItem('globalSearchHistory')
    if (savedHistory) {
      try {
        const history = JSON.parse(savedHistory)
        setSearchHistory(history.slice(0, 5)) // Keep only last 5 searches
      } catch (error) {
        console.warn('Failed to load search history:', error)
      }
    }
  }, [])

  // Save search to history
  const saveToHistory = useCallback((term: string) => {
    if (term.trim().length < 2) return

    setSearchHistory(prev => {
      const existing = prev.find(item => item.term.toLowerCase() === term.toLowerCase())
      let newHistory: SearchHistoryItem[]

      if (existing) {
        // Update frequency and move to top
        newHistory = [
          { ...existing, frequency: existing.frequency + 1, timestamp: Date.now() },
          ...prev.filter(item => item.term.toLowerCase() !== term.toLowerCase())
        ]
      } else {
        // Add new search term
        newHistory = [
          { term, timestamp: Date.now(), frequency: 1 },
          ...prev
        ]
      }

      // Keep only top 5 most recent/frequent searches
      const sortedHistory = newHistory
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, 5)

      // Save to localStorage
      localStorage.setItem('globalSearchHistory', JSON.stringify(sortedHistory))
      return sortedHistory
    })
  }, [])

  // Debounced search to avoid excessive API calls
  const debouncedSearch = useCallback((term: string) => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }
    
    debounceRef.current = setTimeout(() => {
      onSearchChange(term)
      if (term.trim()) {
        saveToHistory(term.trim())
      }
    }, 300) // 300ms debounce
  }, [onSearchChange, saveToHistory])

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setLocalSearchTerm(value)
    setShowDropdown(value.length === 0 && showSuggestions) // Show suggestions when empty
    debouncedSearch(value)
  }, [debouncedSearch, showSuggestions])

  const handleClear = useCallback(() => {
    setLocalSearchTerm('')
    setShowDropdown(false)
    onClearSearch()
    if (inputRef.current) {
      inputRef.current.focus()
    }
  }, [onClearSearch])

  const handleHistoryItemClick = useCallback((term: string) => {
    setLocalSearchTerm(term)
    setShowDropdown(false)
    onSearchChange(term)
    saveToHistory(term)
    if (inputRef.current) {
      inputRef.current.blur()
    }
  }, [onSearchChange, saveToHistory])

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      if (showDropdown) {
        setShowDropdown(false)
      } else {
        handleClear()
      }
    }
  }, [handleClear, showDropdown])

  const handleFocus = useCallback(() => {
    setIsFocused(true)
    if (localSearchTerm.length === 0 && showSuggestions && searchHistory.length > 0) {
      setShowDropdown(true)
    }
  }, [localSearchTerm, showSuggestions, searchHistory])

  const handleBlur = useCallback(() => {
    setIsFocused(false)
    // Delay hiding dropdown to allow clicks on history items
    setTimeout(() => setShowDropdown(false), 150)
  }, [])

  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Sync with external search term changes
  useEffect(() => {
    setLocalSearchTerm(searchTerm)
  }, [searchTerm])

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
    }
  }, [])

  const clearSearchHistory = useCallback(() => {
    setSearchHistory([])
    localStorage.removeItem('globalSearchHistory')
  }, [])

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <div className={`relative flex items-center transition-all duration-200 ${
        isFocused 
          ? 'ring-2 ring-blue-500 ring-opacity-50 border-blue-300' 
          : 'border-gray-300 hover:border-gray-400'
      } border rounded-lg bg-white shadow-sm`}>
        {/* Search Icon */}
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className={`h-4 w-4 transition-colors duration-200 ${
            isFocused ? 'text-blue-500' : 'text-gray-400'
          }`} />
        </div>

        {/* Input Field */}
        <input
          ref={inputRef}
          type="text"
          value={localSearchTerm}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder}
          className="block w-full pl-10 pr-10 py-2.5 text-sm text-gray-900 placeholder-gray-500 bg-transparent border-0 rounded-lg focus:outline-none focus:ring-0"
        />

        {/* Clear Button */}
        {localSearchTerm && (
          <button
            onClick={handleClear}
            className="absolute inset-y-0 right-0 pr-3 flex items-center hover:text-gray-600 text-gray-400 transition-colors duration-200"
            title="Clear search"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Search Dropdown */}
      {(showDropdown || localSearchTerm) && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-80 overflow-y-auto">
          {/* Active Search Status */}
          {localSearchTerm && (
            <>
              <div className="px-3 py-2 text-xs text-gray-600 border-b border-gray-100">
                <div className="flex items-center space-x-2">
                  <Filter className="h-3 w-3" />
                  <span>Searching across Organizations, Projects, and Users</span>
                </div>
              </div>
              <div className="px-3 py-2 text-xs text-gray-500 border-b border-gray-100">
                <div className="flex flex-wrap gap-2">
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    Organizations
                  </span>
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Projects
                  </span>
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                    Users
                  </span>
                </div>
              </div>
            </>
          )}

          {/* Search History */}
          {showDropdown && !localSearchTerm && searchHistory.length > 0 && (
            <>
              <div className="px-3 py-2 text-xs font-medium text-gray-700 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Clock className="h-3 w-3" />
                  <span>Recent Searches</span>
                </div>
                <button
                  onClick={clearSearchHistory}
                  className="text-gray-400 hover:text-gray-600 text-xs"
                >
                  Clear
                </button>
              </div>
              <div className="py-1">
                {searchHistory.map((item, index) => (
                  <button
                    key={index}
                    onClick={() => handleHistoryItemClick(item.term)}
                    className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center justify-between group"
                  >
                    <span className="truncate">{item.term}</span>
                    <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      {item.frequency > 1 && (
                        <span className="flex items-center text-xs text-gray-400">
                          <TrendingUp className="h-3 w-3 mr-1" />
                          {item.frequency}
                        </span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </>
          )}

          {/* No History Message */}
          {showDropdown && !localSearchTerm && searchHistory.length === 0 && (
            <div className="px-3 py-4 text-center text-sm text-gray-500">
              <Clock className="h-4 w-4 mx-auto mb-2 text-gray-400" />
              <p>No recent searches</p>
              <p className="text-xs mt-1">Start typing to search across all data</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// Hook for managing global search state
export function useGlobalSearch() {
  const [searchTerm, setSearchTerm] = useState('')
  const [isSearching, setIsSearching] = useState(false)

  const handleSearchChange = useCallback((term: string) => {
    setSearchTerm(term)
    setIsSearching(term.length > 0)
  }, [])

  const handleClearSearch = useCallback(() => {
    setSearchTerm('')
    setIsSearching(false)
  }, [])

  return {
    searchTerm,
    isSearching,
    handleSearchChange,
    handleClearSearch
  }
}