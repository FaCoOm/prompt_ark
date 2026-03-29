import { useState, useEffect, useMemo, useCallback } from 'react'
import { supabase, type Prompt } from './lib/supabase'
import { initAuthSync } from './lib/auth-sync'
import {
  Header,
  SearchBar,
  CategoryTabs,
  SortSelect,
  PromptGrid,
  DetailModal,
  Voting,
  ToastProvider,
  useToast,
  Loading,
  Pagination,
  LandingPage,
  LegalPage,
  SiteFooter,
} from './components'
import { APP_NAME, HUB_PATH, getHubUrl } from './lib/site'
import { I18nProvider } from './lib/i18n'
import type { LegalSection } from './lib/legal'

type SortOption = 'trending' | 'newest' | 'topRated' | 'quality'

const PAGE_SIZE = 12

function normalizePath(pathname: string) {
  if (!pathname) return '/'
  if (pathname.length > 1 && pathname.endsWith('/')) {
    return pathname.slice(0, -1)
  }
  return pathname
}

function getLegalSection(pathname: string): LegalSection | null {
  if (pathname === '/privacy') return 'privacy'
  if (pathname === '/terms') return 'terms'
  return null
}

function extractVariablesFromContent(content: string): string[] {
  const vars = (content || '').match(/\{\{([^}]+)\}\}/g) || []
  return [...new Set(vars.map(v => v.replace(/\{\{|\}\}/g, '').split(/[:=|]/)[0].trim()))]
}

function extractBatchPromptIds(searchString: string): string[] {
  const params = new URLSearchParams(searchString)
  const rawIds = params.get('ids')

  if (!rawIds) return []

  return [...new Set(
    rawIds
      .split(',')
      .map(id => id.trim())
      .filter(Boolean)
  )]
}

function updatePromptParamsInUrl(promptId: string | null, batchPromptIds: string[]) {
  const url = new URL(window.location.href)

  if (batchPromptIds.length > 0) {
    url.searchParams.set('ids', batchPromptIds.join(','))
  } else {
    url.searchParams.delete('ids')
  }

  if (promptId) {
    url.searchParams.set('id', promptId)
  } else {
    url.searchParams.delete('id')
    url.searchParams.delete('prompt')
  }

  window.history.replaceState({}, '', url.toString())
}

function exitBatchShareView() {
  const url = new URL(window.location.href)
  url.searchParams.delete('ids')
  url.searchParams.delete('id')
  url.searchParams.delete('prompt')
  window.location.assign(url.toString())
}

function waitForExtensionImport(payload: unknown, timeoutMs = 2000): Promise<boolean> {
  return new Promise((resolve) => {
    let settled = false

    const cleanup = () => {
      window.removeEventListener('message', handleMessage)
      window.clearTimeout(timeoutId)
    }

    const finish = (success: boolean) => {
      if (settled) return
      settled = true
      cleanup()
      resolve(success)
    }

    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return
      if (event.data?.type === 'PROMPT_ARK_IMPORT_SUCCESS') {
        finish(true)
      }
    }

    const timeoutId = window.setTimeout(() => finish(false), timeoutMs)

    window.addEventListener('message', handleMessage)
    window.postMessage({ type: 'PROMPT_ARK_IMPORT', payload }, '*')
  })
}

interface HubContentProps {
  user: any
  onAuthChange: (user: any) => void
}

function HubContent({ user, onAuthChange }: HubContentProps) {
  const [prompts, setPrompts] = useState<Prompt[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState<string>('all')
  const [sort, setSort] = useState<SortOption>('trending')
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedPrompt, setSelectedPrompt] = useState<Prompt | null>(null)
  const { showToast } = useToast()
  const batchPromptIds = useMemo(() => extractBatchPromptIds(window.location.search), [])
  const isBatchShareView = batchPromptIds.length > 0

  const handlePromptClick = useCallback((prompt: Prompt) => {
    setSelectedPrompt(prompt)
    updatePromptParamsInUrl(prompt.id, batchPromptIds)
  }, [batchPromptIds])

  const handleCloseDetail = useCallback(() => {
    setSelectedPrompt(null)
    updatePromptParamsInUrl(null, batchPromptIds)
  }, [batchPromptIds])

  const handleExitBatchView = useCallback(() => {
    exitBatchShareView()
  }, [])

  const loadPromptById = useCallback(async (id: string) => {
    const { data, error } = await supabase
      .from('prompts')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error) {
      console.error('Error loading prompt:', error)
      showToast('Failed to load prompt')
      return
    }
    
    if (data && ['public', 'unlisted'].includes(data.visibility)) {
      setSelectedPrompt(data)
    } else if (data?.visibility === 'private') {
      showToast('This prompt is private')
    }
  }, [showToast])

  const loadPrompts = useCallback(async () => {
    setLoading(true)

    let data: Prompt[] | null = null
    let error: unknown = null

    if (batchPromptIds.length > 0) {
      const result = await supabase
        .from('prompts')
        .select('*')
        .in('id', batchPromptIds)

      data = result.data
      error = result.error
    } else {
      const result = await supabase
        .from('prompts')
        .select('*')
        .eq('visibility', 'public')

      data = result.data
      error = result.error
    }
    
    if (error) {
      console.error('Error loading prompts:', error)
      showToast('Failed to load prompts')
    } else {
      let sorted: Prompt[]

      if (batchPromptIds.length > 0) {
        const visiblePrompts = (data || []).filter(p => ['public', 'unlisted'].includes(p.visibility))
        const orderMap = new Map(batchPromptIds.map((id, index) => [id, index]))
        sorted = visiblePrompts.sort((a, b) => (orderMap.get(a.id) ?? 0) - (orderMap.get(b.id) ?? 0))
      } else {
        sorted = (data || []).sort((a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )
      }

      setPrompts(sorted)
    }
    setLoading(false)
  }, [batchPromptIds, showToast])

  // Get unique categories from prompts
  const categories = useMemo(() => {
    const cats = new Set<string>()
    prompts.forEach(p => { if (p.category) cats.add(p.category) })
    return ['all', ...Array.from(cats).sort()]
  }, [prompts])

  const handleExternalLoginTrigger = async () => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('action') !== 'login' || params.get('source') !== 'extension') return
    
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: getHubUrl(),
        queryParams: { access_type: 'offline', prompt: 'consent' },
      },
    })
    if (error) console.error('Auto login error:', error)
  }

  useEffect(() => {
    initAuthSync()
    handleExternalLoginTrigger()
  }, [])

  useEffect(() => {
    loadPrompts()
  }, [loadPrompts])

  useEffect(() => {
    if (isBatchShareView) return undefined

    const channel = supabase
      .channel('prompts-insert')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'prompts',
          filter: 'visibility=eq.public',
        },
        (payload) => {
          console.log('[Hub] New prompt inserted:', payload.new)
          setPrompts((prev) => {
            const newList = [payload.new as Prompt, ...prev]
            return newList.sort((a, b) => 
              new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            )
          })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [isBatchShareView])

  // Load prompt by ID from URL params (supports unlisted access)
  useEffect(() => {
    if (isBatchShareView) return

    const params = new URLSearchParams(window.location.search)
    const promptId = params.get('prompt') || params.get('id')
    if (promptId) {
      loadPromptById(promptId)
    }
  }, [isBatchShareView, loadPromptById])

  // Open detail when id param present in URL (fallback to local search)
  useEffect(() => {
    if (prompts.length === 0) return
    const params = new URLSearchParams(window.location.search)
    const id = params.get('id')
    if (id) {
      const found = prompts.find(p => p.id === id)
      if (found) {
        setSelectedPrompt(found)
      }
    }
  }, [prompts])

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [category, search, sort])

  // Filter and sort prompts
  const filteredPrompts = useMemo(() => {
    let list = [...prompts]

    // Category filter (case-insensitive)
    if (category !== 'all') {
      list = list.filter(p => p.category?.toLowerCase() === category.toLowerCase())
    }

    // Search filter (fuzzy: title, category, author, tags)
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

  // Paginated prompts
  const paginatedPrompts = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE
    return filteredPrompts.slice(start, start + PAGE_SIZE)
  }, [filteredPrompts, currentPage])

  const totalPages = Math.ceil(filteredPrompts.length / PAGE_SIZE)

  // Handle vote - directly update prompts table
  async function handleVote(type: 'up' | 'down') {
    if (!selectedPrompt) return

    const currentUpvotes = selectedPrompt.upvotes || 0
    const currentDownvotes = selectedPrompt.downvotes || 0

    // Optimistic update
    const updated = { 
      ...selectedPrompt,
      upvotes: type === 'up' ? currentUpvotes + 1 : currentUpvotes,
      downvotes: type === 'down' ? currentDownvotes + 1 : currentDownvotes
    }
    setSelectedPrompt(updated)

    // Update local prompts list
    setPrompts(prompts.map(p => 
      p.id === selectedPrompt.id ? updated : p
    ))

    // Save to Supabase
    if (type === 'up') {
      await supabase
        .from('prompts')
        .update({ upvotes: currentUpvotes + 1 })
        .eq('id', selectedPrompt.id)
    } else {
      await supabase
        .from('prompts')
        .update({ downvotes: currentDownvotes + 1 })
        .eq('id', selectedPrompt.id)
    }
  }

  // Handle install - directly update prompts table
  async function handleInstall() {
    if (!selectedPrompt) return

    const currentInstallCount = selectedPrompt.install_count || 0

    // Check if this is a pack
    const isPack = selectedPrompt.type === 'pack'

    let payload

    if (isPack) {
      // Pack: parse content as JSON array
      try {
        const packItems = JSON.parse(selectedPrompt.content || '[]')
        payload = {
          format: 'prompt-ark',
          version: 1,
          prompts: packItems.map((item: any) => ({
            title: item.title,
            content: item.content,
            category: item.category || '',
            tags: item.tags || [],
            variables: extractVariablesFromContent(item.content || '').map(name => ({ name }))
          })),
          pack: { title: selectedPrompt.title, count: packItems.length }
        }
      } catch {
        showToast('❌ Failed to parse pack data')
        return
      }
    } else {
      const uniqueVars = extractVariablesFromContent(selectedPrompt.content || '')
      payload = {
        format: 'prompt-ark',
        version: 1,
        prompts: [{
          title: selectedPrompt.title,
          content: selectedPrompt.content,
          category: selectedPrompt.category,
          tags: selectedPrompt.tags,
          variables: uniqueVars.map(v => ({ name: v }))
        }]
      }
    }

    const imported = await waitForExtensionImport(payload)
    if (!imported) {
      showToast('❌ Prompt Ark did not confirm the import')
      return
    }

    const updated = {
      ...selectedPrompt,
      install_count: currentInstallCount + 1
    }
    setSelectedPrompt(updated)
    setPrompts(prompts.map(p =>
      p.id === selectedPrompt.id ? updated : p
    ))
    showToast('✅ Prompt sent to Prompt Ark!')

    // Save to Supabase
    await supabase
      .from('prompts')
      .update({ install_count: currentInstallCount + 1 })
      .eq('id', selectedPrompt.id)
  }

  // Handle copy link
  function handleCopyLink() {
    if (!selectedPrompt) return
    const shareUrl = `${window.location.origin}${window.location.pathname}?id=${selectedPrompt.id}`
    navigator.clipboard.writeText(shareUrl).then(() => {
      showToast('✅ Share link copied!')
    }).catch(() => {
      showToast('❌ Failed to copy link')
    })
  }

  // Handle fork (only for single prompts, not packs)
  async function handleFork() {
    if (!selectedPrompt) return
    if (!selectedPrompt.content) {
      showToast('❌ No prompt data to fork')
      return
    }

    // Extract variables from content
    const uniqueVars = extractVariablesFromContent(selectedPrompt.content || '')

    const payload = {
      format: 'prompt-ark',
      version: 1,
      prompts: [{
        title: `[Fork] ${selectedPrompt.title || 'Untitled'}`,
        content: selectedPrompt.content,
        category: selectedPrompt.category || '',
        tags: [...(selectedPrompt.tags || []), 'forked'],
        variables: uniqueVars.map(v => ({ name: v }))
      }],
    }

    const imported = await waitForExtensionImport(payload)
    if (!imported) {
      showToast('❌ Prompt Ark did not confirm the fork import')
      return
    }

    showToast(`🍴 Forked prompt to Prompt Ark!`)
  }

  const handleCategoryChange = useCallback((cat: string) => {
    setCategory(cat)
    setCurrentPage(1)
  }, [])

  return (
    <div className="hub-container">
      <Header 
        user={user}
        onAuthChange={onAuthChange}
      />
      
      
      <div className="hub-title-section">
        <h1 className="hub-title">{APP_NAME} Hub</h1>
        <p className="hub-subtitle">Discover, install, and share AI prompts from the community</p>
      </div>

      {isBatchShareView ? (
        <div className="hub-batch-banner">
          <div className="hub-batch-banner-copy">
            <div className="hub-batch-banner-title">This share contains {batchPromptIds.length} prompts</div>
            <div className="hub-batch-banner-text">
              You are viewing only this shared batch. Click any card to open its details.
            </div>
          </div>
          <div className="hub-batch-banner-actions">
            <button className="hub-action-btn" onClick={handleExitBatchView}>
              View full Hub
            </button>
          </div>
        </div>
      ) : null}

      <SearchBar value={search} onChange={setSearch} />
      
      <div className="hub-controls">
        <CategoryTabs 
          categories={categories} 
          activeCategory={category} 
          onChange={handleCategoryChange} 
        />
        <SortSelect value={sort} onChange={setSort} />
      </div>
      
      <div className="hub-stats">
        <span className="hub-stats-count">
          <strong>{filteredPrompts.length}</strong> of {prompts.length} prompts
        </span>
      </div>

      {loading ? (
        <Loading />
      ) : (
        <>
          <PromptGrid 
            prompts={paginatedPrompts} 
            onPromptClick={handlePromptClick} 
          />
          <Pagination 
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={filteredPrompts.length}
            onPageChange={setCurrentPage}
          />
        </>
      )}

      <SiteFooter />

      <DetailModal 
        prompt={selectedPrompt} 
        onClose={handleCloseDetail}
        onCopyLink={handleCopyLink}
        onFork={handleFork}
        onInstall={handleInstall}
      >
        {selectedPrompt && (
          <>
            <Voting 
              upvotes={selectedPrompt.upvotes || 0}
              downvotes={selectedPrompt.downvotes || 0}
              onVote={handleVote}
            />
          </>
        )}
      </DetailModal>
    </div>
  )
}

export default function App() {
  return (
    <I18nProvider>
      <AppShell />
    </I18nProvider>
  )
}

function AppShell() {
  const [user, setUser] = useState<any>(null)
  const pathname = normalizePath(window.location.pathname)
  const legalSection = getLegalSection(pathname)
  
  const urlParams = new URLSearchParams(window.location.search)
  const hasPromptParam = urlParams.get('prompt') || urlParams.get('id') || urlParams.get('ids')
  const isHubRoute = pathname === HUB_PATH || hasPromptParam

  useEffect(() => {
    if (isHubRoute) {
      document.title = `${APP_NAME} Hub — Discover & Install AI Prompts`
    }
  }, [isHubRoute])

  useEffect(() => {
    initAuthSync()

    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  return (
    <ToastProvider>
      {legalSection ? (
        <LegalPage section={legalSection} user={user} onAuthChange={setUser} />
      ) : isHubRoute ? (
        <HubContent user={user} onAuthChange={setUser} />
      ) : (
        <LandingPage user={user} onAuthChange={setUser} />
      )}
    </ToastProvider>
  )
}
