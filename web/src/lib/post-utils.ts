import type { PostData } from '@/lib/api-client';

export function dedupePostsById(posts: PostData[]) {
  const seen = new Set<string>();

  return posts.filter((post) => {
    if (seen.has(post.id)) {
      return false;
    }

    seen.add(post.id);
    return true;
  });
}
