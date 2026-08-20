import React, { useEffect, useState, useRef } from 'react';

interface Item {
  id: number;
  title: string;
  description?: string;
  imageUrl: string;
  createdAt: string;
}

const ITLPPage: React.FC = () => {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Item | null>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [commentText, setCommentText] = useState('');
  const [posting, setPosting] = useState(false);
  const [infoMsg, setInfoMsg] = useState('');
  const commentsRef = useRef<HTMLDivElement>(null);
  const commentInputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        // Fetch approved TLP activities from public endpoint (no auth required)
        const url = '/api/public/tlp/approved';
        const res = await fetch(url, { headers: { Accept: 'application/json' } });
        if (!res.ok) {
          const text = await res.text();
          throw new Error(`HTTP ${res.status}: ${text.slice(0, 200)}`);
        }
        const activities = await res.json();

        const mapped: Item[] = (activities || []).map((a: any) => {
          const title = a.activity_name || a.title || 'TLP Activity';
          const description = a.description || '';
          let imageUrl: string = a.image_file || a.imageUrl || '';

          // Normalize image URLs from backend uploads folder
          if (imageUrl) {
            // Avoid unstable Google thumbnails
            if (imageUrl.includes('images?q=tbn:')) {
              imageUrl = '';
            }
            // If it's a relative uploads path like 'Uploads/...' or 'uploads/...'
            else if (imageUrl.startsWith('Uploads/') || imageUrl.startsWith('uploads/')) {
              imageUrl = `/${imageUrl}`; // '/Uploads/...' or '/uploads/...'
            }
            // If already absolute http(s) or starts with '/', keep as is
          }

          return {
            id: a.id,
            title,
            description,
            imageUrl,
            createdAt: a.created_at || a.createdAt || new Date().toISOString(),
          } as Item;
        });

        setItems(mapped);
      } catch (e: any) {
        setError(e?.message || 'Failed to load');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const fetchComments = async (id: number) => {
    try {
      const res = await fetch(`/api/public/tlp/${id}/comments`);
      if (!res.ok) {
        console.error('Failed to fetch comments', await res.text());
        setComments([]);
        return;
      }
      const data = await res.json();
      setComments(data || []);
    } catch (err) {
      console.error('Error fetching comments', err);
      setComments([]);
    }
  };

  const timeAgo = (iso?: string) => {
    if (!iso) return '';
    const d = new Date(iso);
    const diff = Math.floor((Date.now() - d.getTime()) / 1000);
    if (diff < 60) return `${diff}s`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
    if (diff < 604800) return `${Math.floor(diff / 86400)}d`;
    return d.toLocaleDateString();
  };

  const openModal = async (it: Item, scrollToComments = false) => {
    setSelected(it);
    setCommentText('');
    try {
      await fetchComments(it.id);
    } catch (e) {
      // ignore
    }
    setTimeout(() => {
      if (scrollToComments) {
        try {
          (commentsRef.current as any)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } catch (err) {}
        try { (commentInputRef.current as any)?.focus(); } catch (e) {}
      }
    }, 120);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-4">Innovative Teaching and Learning Process - CSE</h1>
      {loading && <p>Loading...</p>}
      {error && <p className="text-red-600">{error}</p>}
      {!loading && !error && items.length === 0 && <p>No approved items yet.</p>}
      <div className="space-y-8">
        {items.map((it, idx) => {
          const reverse = idx % 2 === 1;
          return (
            <section key={it.id} className={`flex flex-col md:flex-row items-center gap-6 p-6 bg-white rounded-lg shadow-sm ${reverse ? 'md:flex-row-reverse' : ''}`}>
              <div className="md:w-1/2 w-full">
                {it.imageUrl ? (
                  <img
                    src={it.imageUrl}
                    alt={it.title}
                    className="w-full h-64 md:h-96 object-cover rounded cursor-pointer"
                    loading="lazy"
                    onClick={() => openModal(it, true)}
                  />
                ) : (
                  <div className="w-full h-64 md:h-96 flex items-center justify-center bg-gray-100 text-gray-400 text-sm rounded">No image</div>
                )}
              </div>

              <div className="md:w-1/2 w-full">
                <h3 className="text-xl font-semibold mb-2">{it.title}</h3>
                {it.description && <p className="text-gray-700 mb-4 whitespace-pre-wrap">{it.description}</p>}
                <div className="text-sm text-gray-500">{new Date(it.createdAt).toLocaleDateString()}</div>
                <div className="mt-4">
                  <button onClick={() => openModal(it, true)} className="px-4 py-2 bg-blue-600 text-white rounded">View & Comment</button>
                </div>
              </div>
            </section>
          );
        })}
      </div>

      {/* Modal for selected item + comments */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="bg-white w-full max-w-4xl max-h-[90vh] overflow-auto rounded-lg shadow-2xl">
            <div className="flex justify-between items-center p-4 border-b">
              <h2 className="text-lg font-semibold">{selected.title}</h2>
              <button className="text-gray-600" onClick={() => { setSelected(null); setComments([]); setCommentText(''); }}>✕</button>
            </div>
              <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                {selected.imageUrl ? (
                  <img
                    src={selected.imageUrl}
                    alt={selected.title}
                    className="w-full h-96 object-contain cursor-pointer"
                    onClick={() => {
                      commentsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                      try { commentInputRef.current?.focus(); } catch (e) {}
                    }}
                  />
                ) : (
                  <div className="w-full h-96 bg-gray-100 flex items-center justify-center">No image</div>
                )}
              </div>
              <div>
                <div className="mb-4"><p className="text-sm text-gray-700">{selected.description}</p></div>
                  <div className="mb-4">
                  <h3 className="font-semibold mb-2">Comments</h3>
                  <div className="max-h-64 overflow-auto space-y-2" ref={commentsRef}>
                    {comments.length === 0 && <p className="text-sm text-gray-500">No comments yet.</p>}
                    {comments.map((c: any) => (
                      <div key={c.id} className="flex gap-3 p-2">
                        <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center text-sm font-semibold text-white">{(c.name || 'U').charAt(0).toUpperCase()}</div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <div className="text-sm font-semibold text-gray-800">{c.name || 'Anonymous'}</div>
                            <div className="text-xs text-gray-400">{timeAgo(c.created_at)}</div>
                          </div>
                          <div className="mt-1 text-sm text-gray-800 whitespace-pre-wrap">{c.content}</div>
                          <div className="mt-2 text-xs text-gray-500"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <form onSubmit={async (e) => {
                  e.preventDefault();
                  if (!commentText.trim()) return;
                  setPosting(true);
                  setInfoMsg('');
                  try {
                    const res = await fetch(`/api/public/tlp/${selected.id}/comments`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ content: commentText, name: 'Guest' })
                    });
                    const json = await res.json().catch(() => ({}));
                    if (!res.ok) {
                      const t = json?.message || await res.text();
                      throw new Error(t || 'Failed');
                    }
                    if (json?.message && json.message.toLowerCase().includes('queued')) {
                      setInfoMsg('Your comment was submitted and is queued for moderation.');
                    } else {
                      setInfoMsg('Comment posted');
                    }
                    setCommentText('');
                    await fetchComments(selected.id);
                  } catch (err) {
                    console.error(err);
                    setInfoMsg('Failed to post comment');
                  } finally {
                    setPosting(false);
                    setTimeout(() => setInfoMsg(''), 4000);
                  }
                }}>
                  <textarea ref={commentInputRef} value={commentText} onChange={(e) => setCommentText(e.target.value)} className="w-full border p-2 rounded mb-2" rows={3} placeholder="Add a comment..." />
                  {infoMsg && <div className="text-xs text-gray-600 mb-2">{infoMsg}</div>}
                  <div className="flex justify-end gap-2">
                    <button type="button" onClick={() => { setSelected(null); setComments([]); setCommentText(''); }} className="px-4 py-2 bg-gray-100 rounded">Close</button>
                    <button type="submit" disabled={posting} className="px-4 py-2 bg-blue-600 text-white rounded">{posting ? 'Posting...' : 'Post'}</button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ITLPPage;
