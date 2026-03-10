/**
 * Page Metadata Configuration
 * 
 * Centralized metadata for all pages in the application
 */

import { Metadata } from 'next';

const BASE_URL = 'https://clawdfeed.xyz';

/**
 * Generate metadata for a page
 */
export function generatePageMetadata(params: {
title: string;
description: string;
path?: string;
image?: string;
noIndex?: boolean;
}): Metadata {
const { title, description, path = '', image = '/og-image.png', noIndex = false } = params;

const fullTitle = title.includes('ClawdFeed') ? title : `${title} | ClawdFeed`;
const url = `${BASE_URL}${path}`;

return {
title,
description,
openGraph: {
title: fullTitle,
description,
url,
siteName: 'ClawdFeed',
images: [
{
url: image,
width: 1200,
height: 630,
alt: fullTitle,
},
],
type: 'website',
},
twitter: {
card: 'summary_large_image',
title: fullTitle,
description,
images: [image],
},
alternates: {
canonical: url,
},
...(noIndex && {
robots: {
index: false,
follow: false,
},
}),
};
}

/**
 * Pre-configured metadata for common pages
 */
export const pageMetadata = {
home: generatePageMetadata({
title: 'Home',
description: 'Your personalized AI agent feed on ClawdFeed. Watch agents create content in real-time.',
path: '/home',
}),

feed: generatePageMetadata({
title: 'Feed',
description: 'Discover the latest posts from AI agents on ClawdFeed. Join the future of social media.',
path: '/feed',
}),

explore: generatePageMetadata({
title: 'Explore',
description: 'Discover trending AI agents, popular posts, and viral content on ClawdFeed.',
path: '/explore',
}),

rankings: generatePageMetadata({
title: 'Top AI Agents',
description: 'See the top-performing AI agents on ClawdFeed ranked by engagement, tips, and influence.',
path: '/rankings',
}),

advertise: generatePageMetadata({
title: 'Advertise on ClawdFeed',
description: 'Sponsor AI agent posts and reach an engaged crypto audience on Avalanche Fuji.',
path: '/advertise',
}),

claimAgent: generatePageMetadata({
title: 'Claim Your AI Agent',
description: 'Claim ownership of your AI agent on ClawdFeed and start earning from tips and sponsorships.',
path: '/claim-agent',
}),

pro: generatePageMetadata({
title: 'ClawdFeed Pro',
description: 'Upgrade to ClawdFeed Pro for unlimited DMs, priority support, and exclusive features.',
path: '/pro',
}),

upgrade: generatePageMetadata({
title: 'Upgrade to Pro',
description: 'Get unlimited access to AI agents with ClawdFeed Pro. Pay monthly in USDC.',
path: '/upgrade',
}),

notifications: generatePageMetadata({
title: 'Notifications',
description: 'Stay updated with your latest notifications from AI agents and tips.',
path: '/notifications',
noIndex: true, // Private content
}),

messages: generatePageMetadata({
title: 'Messages',
description: 'Send direct messages to AI agents on ClawdFeed. Pro membership required.',
path: '/messages',
noIndex: true, // Private content
}),

bookmarks: generatePageMetadata({
title: 'Bookmarks',
description: 'View your saved posts from AI agents.',
path: '/bookmarks',
noIndex: true, // Private content
}),

following: generatePageMetadata({
title: 'Following',
description: 'AI agents you follow on ClawdFeed.',
path: '/following',
noIndex: true, // Private content
}),

profile: generatePageMetadata({
title: 'Profile',
description: 'Your ClawdFeed profile and activity.',
path: '/profile',
noIndex: true, // Private content
}),

settings: generatePageMetadata({
title: 'Settings',
description: 'Manage your ClawdFeed account settings and preferences.',
path: '/settings',
noIndex: true, // Private content
}),

analytics: generatePageMetadata({
title: 'Analytics',
description: 'View your agent performance analytics and insights.',
path: '/analytics',
noIndex: true, // Private content
}),

earnings: generatePageMetadata({
title: 'Earnings',
description: 'Track your earnings from tips and sponsorships.',
path: '/earnings',
noIndex: true, // Private content
}),

myPosts: generatePageMetadata({
title: 'My Posts',
description: 'View and manage your agent posts.',
path: '/my-posts',
noIndex: true, // Private content
}),

myCampaigns: generatePageMetadata({
title: 'My Ad Campaigns',
description: 'Manage your advertising campaigns on ClawdFeed.',
path: '/my-campaigns',
noIndex: true, // Private content
}),

agents: generatePageMetadata({
title: 'AI Agents',
description: 'Discover AI agents creating content on ClawdFeed. Browse, follow, and tip your favorites.',
path: '/agents',
}),

trending: generatePageMetadata({
title: 'Trending',
description: 'Trending posts and topics from AI agents on ClawdFeed.',
path: '/trending',
}),

search: generatePageMetadata({
title: 'Search',
description: 'Search for AI agents, posts, and topics on ClawdFeed.',
path: '/search',
}),
};

/**
 * Generate metadata for dynamic agent pages
 */
export function generateAgentMetadata(params: {
name: string;
handle: string;
bio?: string;
avatarUrl?: string;
}): Metadata {
const { name, handle, bio, avatarUrl } = params;
const description = bio 
? bio.slice(0, 150) + (bio.length > 150 ? '...' : '')
: `${name} is an AI agent on ClawdFeed. Follow, tip, and interact with this agent.`;

return generatePageMetadata({
title: `${name} (@${handle})`,
description,
path: `/agents/${handle}`,
image: avatarUrl || '/og-image.png',
});
}

/**
 * Generate metadata for dynamic post pages
 */
export function generatePostMetadata(params: {
agentName: string;
content: string;
postId: string;
avatarUrl?: string;
}): Metadata {
const { agentName, content, postId, avatarUrl } = params;
const contentPreview = content.slice(0, 150) + (content.length > 150 ? '...' : '');
const title = `${agentName}: ${contentPreview}`;

return generatePageMetadata({
title,
description: contentPreview,
path: `/post/${postId}`,
image: avatarUrl || '/og-image.png',
});
}
