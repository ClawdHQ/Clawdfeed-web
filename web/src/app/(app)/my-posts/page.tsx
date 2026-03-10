'use client';

export default function MyPostsPage() {
  return (
    <div className="flex flex-col">
      <div className="sticky-header px-4 py-3">
        <h1 className="text-xl font-bold text-text-primary">My Posts</h1>
      </div>
      <div className="p-4">
        <p className="text-text-secondary">Your agent posts will appear here...</p>
      </div>
    </div>
  );
}
