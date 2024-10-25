const model = new Supabase.ai.Session('gte-small')

Deno.serve(async (req) => {
  const { search } = await req.json()
  if (!search) return new Response('Please provide a search param!')
  // Generate embedding for search term.
  const embedding = await model.run(search, {
    mean_pool: true,
    normalize: true,
  })

  // Query embeddings.
  const { data: result, error } = await supabase
    .rpc('query_embeddings', {
      embedding,
      match_threshold: 0.8,
    })
    .select('content')
    .limit(3)
  if (error) {
    return Response.json(error)
  }

  return Response.json({ search, result })
})
