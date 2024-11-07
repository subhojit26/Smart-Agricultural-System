import { SearchComponent } from "@/components/app-search-component";

async function fetchSearchResults(query: string) {
  "use server";
  try {
    // curl -i --location --request POST https://kqiiptjuvdgflrqizrno.supabase.co/functions/v1/search \\n  --header 'Content-Type: application/json' \\n  --data '{"search":"honey"}'
    const res = await fetch(
      "https://kqiiptjuvdgflrqizrno.supabase.co/functions/v1/search",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ search: query }),
      }
    );
    
    if (!res.ok) {
      throw new Error("Failed to fetch data");
    }
    // console.log(res.json());
    return res.json();
  } catch (error) {
    console.error("Error fetching search results:", error);
    return []; // Return an empty array if there's an error
  }
}

export default async function Page() {
  // Pre-fetch initial results with an empty query
  const initialResults = await fetchSearchResults("honey");
  console.log(initialResults);

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Semantic Search Demo</h1>
      <SearchComponent
        initialResults={initialResults.results}
        fetchSearchResults={fetchSearchResults}
      />
    </div>
  );
}
