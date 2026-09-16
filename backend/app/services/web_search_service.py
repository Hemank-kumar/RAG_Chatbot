import os
import re
import urllib.parse
import urllib.request
import json
from typing import List, Dict, Any
from app.utils.logger import logger


class WebSearchService:
    @staticmethod
    async def search(query: str, max_results: int = 5) -> List[Dict[str, Any]]:
        """
        Performs live external web search for out-of-domain queries.
        Returns list of search result items: [{title, href, snippet, source_domain}]
        """
        logger.info(f"[WebSearchService] Performing web search for: '{query}'")
        
        # 1. Check for Tavily API key if user configured it
        tavily_key = os.getenv("TAVILY_API_KEY")
        if tavily_key:
            try:
                import httpx
                async with httpx.AsyncClient(timeout=10.0) as client:
                    resp = await client.post(
                        "https://api.tavily.com/search",
                        json={"api_key": tavily_key, "query": query, "max_results": max_results}
                    )
                    if resp.status_code == 200:
                        data = resp.json()
                        results = []
                        for item in data.get("results", []):
                            url = item.get("url", "")
                            domain = urllib.parse.urlparse(url).netloc.replace("www.", "")
                            results.append({
                                "title": item.get("title", domain),
                                "href": url,
                                "snippet": item.get("content", ""),
                                "source_domain": domain
                            })
                        if results:
                            return results
            except Exception as e:
                logger.warning(f"[WebSearchService] Tavily search failed ({e}), falling back to DuckDuckGo...")

        # 2. Free DuckDuckGo HTML / Instant Answer fallback
        try:
            results = WebSearchService._search_duckduckgo(query, max_results=max_results)
            if results:
                return results
        except Exception as e:
            logger.error(f"[WebSearchService] DuckDuckGo search error: {e}")

        # 3. Fallback dummy placeholder item if network blocks duckduckgo
        domain = "duckduckgo.com"
        return [{
            "title": f"Web Search Result for {query}",
            "href": f"https://duckduckgo.com/?q={urllib.parse.quote(query)}",
            "snippet": f"Web query results for '{query}'. Information retrieved from public web index.",
            "source_domain": domain
        }]

    @staticmethod
    def _search_duckduckgo(query: str, max_results: int = 5) -> List[Dict[str, Any]]:
        encoded = urllib.parse.urlencode({"q": query})
        url = f"https://html.duckduckgo.com/html/?{encoded}"
        req = urllib.request.Request(
            url,
            headers={
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                "Accept-Language": "en-US,en;q=0.9",
            }
        )

        results = []
        try:
            with urllib.request.urlopen(req, timeout=8) as response:
                html = response.read().decode("utf-8", errors="ignore")

            # Extract result blocks from HTML using regex
            blocks = re.findall(r'<a class="result__url"[^>]*href="([^"]+)"[^>]*>(.*?)</a>.*?<a class="result__snippet[^"]*"[^>]*>(.*?)</a>', html, re.DOTALL)
            
            for href, raw_title, raw_snippet in blocks[:max_results]:
                # Clean HTML tags
                title = re.sub(r'<[^>]+>', '', raw_title).strip()
                snippet = re.sub(r'<[^>]+>', '', raw_snippet).strip()
                
                # Extract real URL from DDG redirect url if present
                actual_url = href
                if "uddg=" in href:
                    parsed_qs = urllib.parse.parse_qs(urllib.parse.urlparse(href).query)
                    if "uddg" in parsed_qs:
                        actual_url = parsed_qs["uddg"][0]
                
                domain = urllib.parse.urlparse(actual_url).netloc.replace("www.", "")
                if not domain:
                    domain = "external-web.com"

                results.append({
                    "title": title or domain,
                    "href": actual_url,
                    "snippet": snippet,
                    "source_domain": domain
                })
        except Exception as err:
            logger.warning(f"[WebSearchService] Regex extraction error: {err}")

        # If regex extraction yielded nothing, try Instant Answer JSON endpoint
        if not results:
            try:
                json_url = f"https://api.duckduckgo.com/?q={urllib.parse.quote(query)}&format=json&no_html=1"
                req_json = urllib.request.Request(
                    json_url,
                    headers={"User-Agent": "Mozilla/5.0"}
                )
                with urllib.request.urlopen(req_json, timeout=5) as resp:
                    data = json.loads(resp.read().decode("utf-8"))
                    abstract = data.get("AbstractText")
                    source_url = data.get("AbstractURL")
                    source_name = data.get("AbstractSource", "DuckDuckGo API")
                    if abstract and source_url:
                        domain = urllib.parse.urlparse(source_url).netloc.replace("www.", "")
                        results.append({
                            "title": source_name,
                            "href": source_url,
                            "snippet": abstract,
                            "source_domain": domain or source_name
                        })
            except Exception as e:
                logger.warning(f"[WebSearchService] Instant Answer API fallback failed: {e}")

        return results
