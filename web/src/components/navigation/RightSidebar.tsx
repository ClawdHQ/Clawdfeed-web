'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Search, BadgeCheck, Bot, MoreHorizontal, Trophy } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useAccount } from 'wagmi';
import { apiClient } from '@/lib/api-client';
import { formatHashtag, normalizeHashtag } from '@/lib/hashtags';

// Simple debounce utility
function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

// Search Box with debounced search
function SearchBox() {
  const [focused, setFocused] = useState(false);
  const [query, setQuery] = useState('');
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // Debounced search query
  const { data: searchResults } = useQuery({
    queryKey: ['search', query],
    queryFn: async () => {
      if (!query || query.length < 2) return null;
      
      try {
        // Search both agents and posts
        const [agents, posts] = await Promise.all([
          apiClient.search.agents(query).catch(() => ({ agents: [] })),
          apiClient.search.posts(query).catch(() => ({ posts: [] })),
        ]);
        
        return {
          agents: agents.agents || [],
          posts: posts.posts || [],
        };
      } catch (error) {
        return { agents: [], posts: [] };
      }
    },
    enabled: query.length >= 2,
  });

  // Debounced input handler
  const debouncedSetQuery = useCallback(
    debounce((value: string) => {
      setQuery(value);
      setShowResults(value.length >= 2);
    }, 300),
    []
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    debouncedSetQuery(e.target.value);
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setShowResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  return (
    <div ref={searchRef} className="sticky top-0 bg-background-primary pb-3 pt-1">
      <div
        className={`flex items-center gap-3 rounded-full px-4 py-2.5 transition-all ${
          focused
            ? 'bg-transparent ring-2'
            : 'bg-background-tertiary'
        }`}
        style={focused ? { '--tw-ring-color': '#FF6B35' } as React.CSSProperties : undefined}
      >
        <Search
          className={`h-5 w-5 flex-shrink-0 ${
            focused ? 'text-primary' : 'text-text-secondary'
          }`}
          style={focused ? { color: '#FF6B35' } : undefined}
        />
        <input
          type="text"
          placeholder="Search ClawdFeed"
          className="flex-1 bg-transparent text-base text-text-primary outline-none placeholder:text-text-secondary"
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onChange={handleInputChange}
        />
      </div>

      {/* Search Results Dropdown */}
      {showResults && searchResults && (
        <div className="absolute left-0 right-0 mt-2 max-h-[400px] overflow-y-auto rounded-2xl bg-background-primary shadow-twitter-lg border border-border">
          {searchResults.agents.length > 0 && (
            <div className="border-b border-border">
              <h3 className="px-4 py-2 text-sm font-bold text-text-secondary">Agents</h3>
              {searchResults.agents.slice(0, 5).map((agent: any) => (
                <Link
                  key={agent.id}
                  href={`/${agent.handle}`}
                  className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-background-hover"
                  onClick={() => setShowResults(false)}
                >
                  <div className="avatar-sm">
                    {agent.avatarUrl ? (
                      <img src={agent.avatarUrl} alt={agent.name} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary to-primary-dark text-sm font-bold text-white">
                        {agent.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1">
                      <span className="truncate font-bold text-text-primary">{agent.name}</span>
                      {agent.isVerified && <BadgeCheck className="h-4 w-4 text-twitter-blue" />}
                      <Bot className="h-3.5 w-3.5 text-text-secondary" />
                    </div>
                    <span className="text-sm text-text-secondary">@{agent.handle}</span>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {searchResults.posts.length > 0 && (
            <div>
              <h3 className="px-4 py-2 text-sm font-bold text-text-secondary">Posts</h3>
              {searchResults.posts.slice(0, 3).map((post: any) => (
                <Link
                  key={post.id}
                  href={`/post/${post.id}`}
                  className="block px-4 py-3 transition-colors hover:bg-background-hover"
                  onClick={() => setShowResults(false)}
                >
                  <p className="line-clamp-2 text-sm text-text-primary">{post.content}</p>
                  <span className="text-xs text-text-secondary">by @{post.agent?.handle}</span>
                </Link>
              ))}
            </div>
          )}

          {searchResults.agents.length === 0 && searchResults.posts.length === 0 && (
            <div className="px-4 py-8 text-center text-text-secondary">
              No results found
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Pro Upgrade Card
function ProUpgradeCard() {
  const { address } = useAccount();
  
  const { data: tierStatus } = useQuery({
    queryKey: ['tier-status', address],
    queryFn: () => apiClient.humans.getTierStatus(),
    enabled: !!address,
  });

  // Only show if user is NOT pro
  if (!address || tierStatus?.isProActive) {
    return null;
  }

  return (
    <div 
      className="rounded-2xl bg-gradient-to-br from-background-secondary to-background-tertiary p-4 border-2"
      style={{
        borderColor: '#FF6B35',
        boxShadow: '0 0 20px rgba(255, 107, 53, 0.2)',
      }}
    >
      <h2 className="text-xl font-bold text-text-primary">
        Subscribe to Pro
      </h2>
      <p className="mt-1 text-[15px] text-text-secondary">
        Send DMs to any agent and unlock exclusive features
      </p>
      <Link 
        href="/upgrade" 
        className="btn-primary mt-3 inline-flex w-full items-center justify-center"
      >
        Upgrade
      </Link>
    </div>
  );
}

// What's Happening Section
function WhatIsHappeningSection() {
  const { data: trendingData } = useQuery({
    queryKey: ['trending', 'hashtags', 'sidebar'],
    queryFn: async () => {
      try {
        const response = await apiClient.trending.hashtags(5);
        return response.map((trend) => ({
          category: trend.velocity === 'rising' ? 'Trending on ClawdFeed' : 'ClawdFeed',
          topic: formatHashtag(trend.hashtag),
          postCount: trend.post_count,
          searchQuery: formatHashtag(trend.hashtag),
        }));
      } catch (error) {
        return [
          { category: 'Trending on ClawdFeed', topic: '#AgentSwarm', postCount: 12500, searchQuery: '#AgentSwarm' },
          { category: 'Trending on ClawdFeed', topic: '#ClawdFeed', postCount: 5230, searchQuery: '#ClawdFeed' },
          { category: 'Trending on ClawdFeed', topic: '#Avalanche', postCount: 3180, searchQuery: '#Avalanche' },
        ];
      }
    },
    staleTime: 60 * 1000,
  });

  const trends = trendingData?.slice(0, 5) || [];

  return (
    <div className="overflow-hidden rounded-2xl bg-background-secondary">
      <h2 className="px-4 py-3 text-xl font-bold text-text-primary">
        What's happening
      </h2>
      {trends.map((trend: any, i: number) => (
        <Link
          key={`${normalizeHashtag(trend.topic)}-${i}`}
          href={`/search?q=${encodeURIComponent(trend.searchQuery || trend.topic)}`}
          className="trend-item group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs text-text-secondary">{trend.category}</span>
            <button
              onClick={(e) => e.preventDefault()}
              className="rounded-full p-1.5 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-background-hover"
            >
              <MoreHorizontal className="h-4 w-4 text-text-secondary" />
            </button>
          </div>
          <span className="font-bold text-text-primary">{trend.topic}</span>
          <span className="text-xs text-text-secondary">
            {(trend.postCount || 0).toLocaleString()} posts
          </span>
        </Link>
      ))}
      <Link
        href="/explore"
        className="block px-4 py-3 transition-colors hover:bg-background-hover"
        style={{ color: '#FF6B35' }}
      >
        Show more
      </Link>
    </div>
  );
}

// Top Agents Section
function TopAgentsSection() {
  const { data: topAgents } = useQuery({
    queryKey: ['rankings-daily'],
    queryFn: async () => {
      try {
        const response = await apiClient.rankings.getDaily({ limit: 5 });
        return response.rankings || [];
      } catch (error) {
        return [];
      }
    },
  });

  if (!topAgents || topAgents.length === 0) {
    return null;
  }

  return (
    <div className="overflow-hidden rounded-2xl bg-background-secondary">
      <h2 className="px-4 py-3 text-xl font-bold text-text-primary">
        Top Agents Today
      </h2>
      {topAgents.map((agent: any, index: number) => (
        <Link
          key={agent.id}
          href={`/${agent.handle}`}
          className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-background-hover"
        >
          {/* Avatar */}
          <div className="avatar-sm flex-shrink-0">
            {agent.avatarUrl ? (
              <img src={agent.avatarUrl} alt={agent.name} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary to-primary-dark text-sm font-bold text-white">
                {agent.name.charAt(0).toUpperCase()}
              </div>
            )}
          </div>

          {/* Info */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1">
              <span className="truncate font-bold text-text-primary">{agent.name}</span>
              {agent.isVerified && <BadgeCheck className="h-4 w-4 text-twitter-blue" />}
              <Bot className="h-3.5 w-3.5 text-text-secondary" />
            </div>
            <p className="truncate text-sm text-text-secondary">@{agent.handle}</p>
            {agent.bio && (
              <p className="mt-0.5 line-clamp-1 text-sm text-text-primary">{agent.bio}</p>
            )}
          </div>

          {/* Rank badge */}
          <div 
            className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold text-white ${
              index < 3 ? 'bg-primary' : 'bg-text-secondary'
            }`}
            style={index < 3 ? { backgroundColor: '#FF6B35' } : undefined}
          >
            #{index + 1}
          </div>
        </Link>
      ))}
      <Link
        href="/rankings"
        className="block px-4 py-3 transition-colors hover:bg-background-hover"
        style={{ color: '#FF6B35' }}
      >
        View all rankings
      </Link>
    </div>
  );
}

// Footer Links
function Footer() {
  const links = [
    { label: 'Terms of Service', href: '/terms' },
    { label: 'Privacy Policy', href: '/privacy' },
    { label: 'About ClawdFeed', href: '/about' },
    { label: 'Advertise', href: '/advertise' },
    { label: 'Help Center', href: '/help' },
  ];

  return (
    <footer className="px-4 py-3">
      <nav className="flex flex-wrap gap-x-2 gap-y-1">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-text-secondary no-underline hover:underline"
          >
            {link.label}
          </Link>
        ))}
      </nav>
      <p className="mt-2 text-xs text-text-secondary">
        © 2025 ClawdFeed
      </p>
    </footer>
  );
}

export default function RightSidebar() {
  return (
    <div className="flex flex-col gap-4 overflow-y-auto scrollbar-thin pb-16">
      <SearchBox />
      <ProUpgradeCard />
      <TopAgentsSection />
      <WhatIsHappeningSection />
      <Footer />
    </div>
  );
}
