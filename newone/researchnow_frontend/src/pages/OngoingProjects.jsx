// import React, { useState } from "react";
// import "./OngoingProjects.css";

// const projectsData = [
//   { id: 1, title: "AI in Healthcare", category: "Artificial Intelligence", description: "Developing AI models to detect diseases faster and more accurately." },
//   { id: 2, title: "Quantum Computing Simulations", category: "Quantum Computing", description: "Building simulation models to test quantum algorithms." },
//   { id: 3, title: "Genetic Engineering", category: "Biotechnology", description: "Advancing CRISPR technology for better gene therapy." },
//   { id: 4, title: "Blockchain for Cybersecurity", category: "Cybersecurity", description: "Implementing decentralized security solutions using blockchain." },
// ];

// const OngoingProjects = () => {
//   const [searchTerm, setSearchTerm] = useState("");

//   const filteredProjects = projectsData.filter((project) =>
//     project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
//     project.category.toLowerCase().includes(searchTerm.toLowerCase())
//   );

//   return (
//     <div className="projects-container">
//       <h1 className="page-title">Ongoing Research Projects</h1>

//       {/* Search Bar */}
//       <input
//         type="text"
//         placeholder="Search projects..."
//         className="search-bar"
//         value={searchTerm}
//         onChange={(e) => setSearchTerm(e.target.value)}
//       />

//       {/* Project List */}
//       <div className="projects-grid">
//         {filteredProjects.length > 0 ? (
//           filteredProjects.map((project) => (
//             <div key={project.id} className="project-card">
//               <h3>{project.title}</h3>
//               <p className="project-category">{project.category}</p>
//               <p className="project-description">{project.description}</p>
//             </div>
//           ))
//         ) : (
//           <p className="no-results">No projects found.</p>
//         )}
//       </div>
//     </div>
//   );
// };

// export default OngoingProjects;


import React, { useState } from "react";
import "./OngoingProjects.css";

const projectsData = [
  { id: 1, title: "AI in Healthcare", category: "Artificial Intelligence", description: "Developing AI models to detect diseases faster and more accurately." },
  { id: 2, title: "Quantum Computing Simulations", category: "Quantum Computing", description: "Building simulation models to test quantum algorithms." },
  { id: 3, title: "Genetic Engineering", category: "Biotechnology", description: "Advancing CRISPR technology for better gene therapy." },
  { id: 4, title: "Blockchain for Cybersecurity", category: "Cybersecurity", description: "Implementing decentralized security solutions using blockchain." },
];

const OngoingProjects = () => {
  const [searchTerm, setSearchTerm] = useState("");

  // OpenAlex integration states
  const [domainQuery, setDomainQuery] = useState("");
  const [papers, setPapers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const filteredProjects = projectsData.filter((project) =>
    project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    project.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const searchOpenAlex = async (e) => {
    e && e.preventDefault();
    if (!domainQuery || domainQuery.trim() === "") return;
    setLoading(true);
    setError(null);
    setPapers([]);

    try {
      // Call backend proxy which queries OpenAlex
      const res = await fetch(`http://localhost:8000/api/openalex?q=${encodeURIComponent(domainQuery)}`);
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err && err.message ? err.message : `Status ${res.status}`);
      }
      const data = await res.json();
      setPapers(data.papers || []);
    } catch (err) {
      console.error('OpenAlex search error', err);
      setError(err.message || 'Failed to fetch papers');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="projects-container">
      <h1 className="page-title">Learn About Domains</h1>

      <input
        type="text"
        placeholder="Search projects..."
        className="search-bar"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />

      <div className="projects-grid">
        {filteredProjects.length > 0 ? (
          filteredProjects.map((project) => (
            <div key={project.id} className="project-card">
              <h3>{project.title}</h3>
              <p className="project-category">{project.category}</p>
              <p className="project-description">{project.description}</p>
              <div style={{ marginTop: '0.6rem' }}>
                {/* Build a Wikipedia URL from the category */}
                <a
                  className="learn-more-btn"
                  href={`https://en.wikipedia.org/wiki/${encodeURIComponent(project.category.replace(/\s+/g, '_'))}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  Learn More
                </a>
              </div>
            </div>
          ))
        ) : (
          <p className="no-results">No projects found.</p>
        )}
      </div>

      <hr style={{ margin: '2rem 0' }} />

      <section className="openalex-section">
        <h2>Search Research Papers</h2>
        <form onSubmit={searchOpenAlex} className="openalex-form">
          <input
            type="text"
            placeholder="Enter domain (e.g. machine learning, web development)"
            value={domainQuery}
            onChange={(e) => setDomainQuery(e.target.value)}
            className="openalex-input"
          />
          <button type="submit" className="openalex-btn" disabled={loading}>
            {loading ? 'Searching...' : 'Search Papers'}
          </button>
        </form>

        {error && <p className="error">{error}</p>}

        <div className="papers-list">
          {papers.length === 0 && !loading && <p>No papers found. Try a different query.</p>}

          {papers.map((p, idx) => (
            <div key={p.id || idx} className="paper-card">
              <h3 className="paper-title">
                <a href={p.openalex_url || p.id} target="_blank" rel="noreferrer">
                  {p.title}
                </a>
              </h3>
              <p className="paper-meta">
                {p.authors && p.authors.length > 0 ? p.authors.slice(0, 5).join(', ') : 'Unknown authors'}
                {p.publication_year ? ` — ${p.publication_year}` : ''}
              </p>
              {p.doi && (
                <p className="paper-link">DOI: <a href={`https://doi.org/${p.doi}`} target="_blank" rel="noreferrer">{p.doi}</a></p>
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default OngoingProjects;
