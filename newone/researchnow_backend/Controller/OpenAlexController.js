const axios = require('axios');

// Controller to proxy requests to OpenAlex and return simplified results
exports.searchOpenAlex = async (req, res) => {
    try {
        const query = req.query.q || req.query.query;
        if (!query) {
            return res.status(400).json({ message: 'Query parameter `q` is required' });
        }

        const encoded = encodeURIComponent(query);
        // Use OpenAlex works search endpoint. Limit to 15 results.
        const url = `https://api.openalex.org/works?search=${encoded}&per-page=15`;

        const response = await axios.get(url, { timeout: 10000 });
        const results = (response.data && response.data.results) || [];

        const papers = results.map((w) => ({
            id: w.id, // OpenAlex URL like https://openalex.org/Wxxxx
            title: w.title,
            authors: (w.authorships || []).map(a => a.author && a.author.display_name).filter(Boolean),
            publication_year: w.publication_year || null,
            openalex_url: w.id || null,
            doi: w.doi || null
        }));

        return res.json({ query, count: papers.length, papers });
    } catch (error) {
        console.error('OpenAlex proxy error:', error && error.message ? error.message : error);
        return res.status(500).json({ message: 'Failed to fetch from OpenAlex', error: error.message });
    }
};
