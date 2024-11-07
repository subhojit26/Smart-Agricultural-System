'use client'

import { useState } from 'react'
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface SearchResult {
  content : string
}

interface SearchComponentProps {
  initialResults: SearchResult[]
  fetchSearchResults: (query: string) => Promise<any>
}

const SafeHTML = ({ html }: { html: string }) => (
  <div dangerouslySetInnerHTML={{ __html: html }} />
)

export function SearchComponent({ initialResults = [], fetchSearchResults }: SearchComponentProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>(initialResults)
  const [isLoading, setIsLoading] = useState(false)

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      const newResults = await fetchSearchResults(query)
      setResults(newResults.result || []) // Ensure we always set an array
    } catch (error) {
      console.error('Error fetching search results:', error)
      setResults([]) // Set empty array on error
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div>
      <form onSubmit={handleSearch} className="mb-4">
        <div className="flex gap-2">
          <Input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Enter your search query"
            className="flex-grow"
          />
          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'Searching...' : 'Search'}
          </Button>
        </div>
      </form>

      {results.length > 0 ? (
        <div className="grid gap-4">
          {results.map((result, index) => (
            <Card key={index}>
              <CardHeader>
                <CardTitle>Result </CardTitle>
              </CardHeader>
              <CardContent>
                <SafeHTML html={result.content} />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <p>No results found. Try a different search query.</p>
      )}
    </div>
  )
}