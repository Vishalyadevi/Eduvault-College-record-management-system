import React, { useEffect, useState, useRef, useMemo } from 'react';
import api from '../../services/api';

const AdminBase = '/admin/tlp/comments';

const escapeRegExp = (s = '') => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const Avatar = ({ name }) => {
  const initials = (name || 'G').split(' ').slice(0,2).map(n => n[0]).join('').toUpperCase();
  return (
    <div className="w-10 h-10 rounded-full bg-indigo-50 text-blue-900 ring-1 ring-indigo-100 flex items-center justify-center font-medium mr-3">{initials}</div>
  );
};

const highlight = (text = '', query = '') => {
  if (!query) return text;
  const parts = text.split(new RegExp(`(${escapeRegExp(query)})`, 'ig'));
  return parts.map((part, i) => (
    <span key={i} className={part.toLowerCase() === query.toLowerCase() ? 'bg-yellow-200 px-0.5' : ''}>{part}</span>
  ));
};

const TlpCommentsAdmin = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deleting, setDeleting] = useState(null);
  // pagination removed: show all posts
  const [expanded, setExpanded] = useState({});
  const [expandedPost, setExpandedPost] = useState(null);
  const timerRef = useRef(null);

  const fetchAll = async () => {
    try {
      setLoading(true);
      const res = await api.get(`${AdminBase}`);
      const data = res && res.data ? res.data : res;
      setPosts(Array.isArray(data) ? data : (data ? [data] : []));
      setExpandedPost(null);
    } catch (err) {
      console.error('Failed to fetch posts with comments', err);
      setPosts([]);
    } finally {
      setLoading(false);
    }
  };

  const searchComments = async (q) => {
    try {
      setLoading(true);
      const res = await api.get(`${AdminBase}/search?q=${encodeURIComponent(q)}`);
      const data = res && res.data ? res.data : res;
      setPosts(Array.isArray(data) ? data : (data ? [data] : []));
      setExpandedPost(null);
      setExpandedPost(null);
    } catch (err) {
      console.error('Search failed', err);
      setPosts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  // debounce search
  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (!search) {
      timerRef.current = setTimeout(() => fetchAll(), 250);
    } else {
      timerRef.current = setTimeout(() => searchComments(search), 300);
    }
    return () => clearTimeout(timerRef.current);
  }, [search]);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this comment permanently?')) return;
    try {
      setDeleting(id);
      await api.delete(`${AdminBase}/${id}`);
      // optimistically remove locally
      setPosts(prev => prev.map(p => ({
        ...p,
        comments: Array.isArray(p.comments) ? p.comments.filter(c => c.id !== id && c._id !== id) : p.comments
      })));
    } catch (err) {
      console.error('Failed to delete comment', err);
      alert('Failed to delete comment');
    } finally {
      setDeleting(null);
    }
  };

  const postList = useMemo(() => posts || [], [posts]);

  const toggleExpand = (cid) => setExpanded(prev => ({ ...prev, [cid]: !prev[cid] }));

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">TLP Comments</h1>
        <div className="text-sm text-indigo-700">Total posts: <span className="ml-2 inline-block bg-indigo-50 text-blue-800 font-medium px-2 py-0.5 rounded">{postList.length}</span></div>
      </div>

      <div className="mb-4 flex flex-col sm:flex-row sm:items-center gap-2">
          <div className="flex items-center w-full sm:w-auto gap-2">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search comments or author"
            className="w-full sm:w-96 p-2 border border-gray-300 rounded shadow-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-300"
          />
          <button onClick={() => { setSearch(''); setExpandedPost(null); }} className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded">Clear</button>
        </div>

        <div className="ml-auto flex items-center gap-2" />
      </div>

      {loading ? (
        <div className="text-center py-12">Loading...</div>
      ) : (
        <div>
          {postList.length === 0 && <div className="text-gray-600">No comments found.</div>}
          <div className="flex flex-col gap-4">
            {postList.map(post => {
              const pid = post.id || post._id;
              const isOpen = expandedPost === pid;
              return (
                <div key={pid} className="bg-gradient-to-br from-white to-gray-50 border border-gray-200 rounded shadow-sm p-4 hover:shadow-md hover:-translate-y-0.5 transition-transform">
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => setExpandedPost(isOpen ? null : pid)}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setExpandedPost(isOpen ? null : pid); }}
                    className="flex items-center justify-between cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className="text-lg font-semibold text-blue-800">{post.activity_name || post.course_code_and_name || 'Untitled'}</div>
                      <div className="text-sm text-gray-500">({(post.comments || []).length})</div>
                    </div>
                    <div className="text-indigo-600 font-medium">{isOpen ? '▾' : '▸'}</div>
                  </div>

                  {isOpen && (
                    <div className="mt-4 space-y-3">
                      {(!post.comments || post.comments.length === 0) && <div className="text-sm text-gray-500">No comments for this post.</div>}
                      {(post.comments || []).map(c => (
                        <div key={c.id || c._id} className="flex items-start gap-3 border rounded p-3 bg-white">
                          <Avatar name={c.name || (c.author && c.author.username) || 'Guest'} />
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <div className="text-sm font-medium">{c.name || (c.author && c.author.username) || 'Guest'}</div>
                              <div className="text-xs text-gray-400">{new Date(c.created_at || c.createdAt || Date.now()).toLocaleString()}</div>
                            </div>
                            <div className="mt-1 text-sm text-gray-700">
                              {expanded[c.id || c._id] ? (
                                <div>
                                  <div>{highlight(c.content || '', search)}</div>
                                  <button onClick={() => toggleExpand(c.id || c._id)} className="text-xs text-indigo-600 mt-1">Show less</button>
                                </div>
                              ) : (
                                <div>
                                  <div className="line-clamp-3">{highlight(c.content || '', search)}</div>
                                  {(c.content || '').length > 200 && <button onClick={() => toggleExpand(c.id || c._id)} className="text-xs text-indigo-600 mt-1">Read more</button>}
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex flex-col gap-2 items-end">
                            <button disabled={deleting === (c.id || c._id)} onClick={() => handleDelete(c.id || c._id)} className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white rounded">Delete</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* pagination removed - showing all activities */}
        </div>
      )}
    </div>
  );
};

export default TlpCommentsAdmin;
