import { useState, useEffect, useMemo } from 'react'
import { supabase, type Prompt } from './lib/supabase'
import {
  Header,
  SearchBar,
  CategoryTabs,
  SortSelect,
  PromptGrid,
  DetailModal,
  Voting,
  InstallButton,
  AuthButton,
  ToastProvider,
  useToast,
  Loading,
} from './components'

type Category = 'all' | 'productivity' | 'writing' | 'coding' | 'education' | 'creative' | 'analysis'
type SortOption = 'trending' | 'newest' | 'topRated' | 'quality'

function AppContent() {
  const [prompts, setPrompts] = useState<Prompt[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState<Category>('all')
  const [sort, setSort] = useState<SortOption>('trending')
  const [selectedPrompt, setSelectedPrompt] = useState<Prompt | null>(null)
  const [user, setUser] = useState<any>(null)
  const [userVotes, setUserVotes] = useState<Record<string, 'up' | 'down'>>({})
  const { showToast } = useToast()

  // Load prompts
  useEffect(() => {
    loadPrompts()
    checkAuth()
  }, [])

  async function loadPrompts() {
    setLoading(true)
    const { data, error } = await supabase
      .from('prompts')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error loading prompts:', error)
      showToast('Failed to load prompts')
    } else {
      setPrompts(data || [])
    }
    setLoading(false)
  }

  async function checkAuth() {
    const { data: { session } } = await supabase.auth.getSession()
    if (session?.user) {
      setUser(session.user)
      loadUserVotes(session.user.id)
    }
  }

  async function loadUserVotes(userId: string) {
    const { data } = await supabase
      .from('votes')
      .select('prompt_id, vote_type')
      .eq('user_id', userId)
    
    if (data) {
      const votes: Record<string, 'up' | 'down'> = {}
      data.forEach(v => { votes[v.prompt_id] = v.vote_type })
      setUserVotes(votes)
    }
  }

  // Filter and sort prompts
  const filteredPrompts = useMemo(() => {
    let list = [...prompts]

    // Category filter
    if (category !== 'all') {
      list = list.filter(p => p.category?.toLowerCase() === category)
    }

    // Search filter
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(p => 
        p.title?.toLowerCase().includes(q) ||
        p.category?.toLowerCase().includes(q) ||
        p.author?.toLowerCase().includes(q) ||
        p.tags?.some(t => t.toLowerCase().includes(q))
      )
    }

    // Sort
    switch (sort) {
      case 'trending':
        list.sort((a, b) => (b.upvotes + b.install_count) - (a.upvotes + a.install_count))
        break
      case 'newest':
        list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        break
      case 'topRated':
        list.sort((a, b) => (b.upvotes - b.downvotes) - (a.upvotes - a.downvotes))
        break
      case 'quality':
        list.sort((a, b) => (b.quality_score || 0) - (a.quality_score || 0))
        break
    }

    return list
  }, [prompts, category, search, sort])

  // Handle vote
  async function handleVote(type: 'up' | 'down') {
    if (!user) {
      showToast('Please sign in to vote')
      return
    }
    if (!selectedPrompt) return

    const currentVote = userVotes[selectedPrompt.id]
    const newVoteType = currentVote === type ? null : type

    // Optimistic update
    const updated = { ...selectedPrompt }
    if (currentVote === 'up') updated.upvotes = (updated.upvotes || 1) - 1
    if (currentVote === 'down') updated.downvotes = (updated.downvotes || 1) - 1
    if (newVoteType === 'up') updated.upvotes = (updated.upvotes || 0) + 1
    if (newVoteType === 'down') updated.downvotes = (updated.downvotes || 0) + 1
    setSelectedPrompt(updated)

    // Update local votes
    const newVotes = { ...userVotes }
    if (newVoteType) {
      newVotes[selectedPrompt.id] = newVoteType
    } else {
      delete newVotes[selectedPrompt.id]
    }
    setUserVotes(newVotes)

    // Save to Supabase
    if (newVoteType) {
      await supabase.from('votes').upsert({
        prompt_id: selectedPrompt.id,
        user_id: user.id,
        vote_type: newVoteType,
      })
    } else {
      await supabase.from('votes').delete()
        .eq('prompt_id', selectedPrompt.id)
        .eq('user_id', user.id)
    }
  }

  // Handle install
  function handleInstall() {
    if (!selectedPrompt) return

    const payload = {
      format: 'prompt-ark',
      version: 1,
      prompts: [{
        title: selectedPrompt.title,
        content: selectedPrompt.content,
        category: selectedPrompt.category,
        tags: selectedPrompt.tags,
      }]
    }

    window.postMessage({ type: 'PROMPT_ARK_IMPORT', payload }, '*')
    showToast('✅ Prompt sent to Prompt Ark!')
  }

  return (
    <div className="hub-container">
      <Header />
      
      <SearchBar value={search} onChange={setSearch} />
      
      <div className="hub-controls">
        <CategoryTabs activeCategory={category} onChange={setCategory} />
        <SortSelect value={sort} onChange={setSort} />
      </div>
      
      <div className="hub-stats">
        <span className="hub-stats-count">
          <strong>{filteredPrompts.length}</strong> of {prompts.length} prompts
        </span>
        <AuthButton user={user} onAuthChange={setUser} />
      </div>

      {loading ? (
        <Loading />
      ) : (
        <PromptGrid 
          prompts={filteredPrompts} 
          onPromptClick={setSelectedPrompt} 
        />
      )}

      <footer className="hub-footer">
        <p>Prompt Ark Hub — Open source community prompt library</p>
        <p><a href="https://github.com/KeyonZeng/prompt_ark" target="_blank">GitHub</a> · Made with ❤️ by the Prompt Ark community</p>
      </footer>

      <DetailModal 
        prompt={selectedPrompt} 
        onClose={() => setSelectedPrompt(null)}
      >
        {selectedPrompt && (
          <>
            <Voting 
              upvotes={selectedPrompt.upvotes || 0}
              downvotes={selectedPrompt.downvotes || 0}
              userVote={userVotes[selectedPrompt.id] || null}
              onVote={handleVote}
              disabled={!user}
            />
            <InstallButton onClick={handleInstall} />
          </>
        )}
      </DetailModal>
    </div>
  )
}

export default function App() {
  return (
    <ToastProvider>
      <AppContent />
    </ToastProvider>
  )
}
