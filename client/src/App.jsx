
import { useEffect, useState } from "react";
import Login from "./login";
import "./App.css";

const API_URL = "http://localhost:5000/api";

export default function App() {
    const [session, setSession] = useState(() => {
        try {
            return JSON.parse(localStorage.getItem("codevault_session")) || null;
        } catch {
            return null;
        }
    });

    const [repositories, setRepositories] = useState([]);
    const [search, setSearch] = useState("");
    const [showForm, setShowForm] = useState(false);
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [visibility, setVisibility] = useState("public");
    const [loading, setLoading] = useState(false);
    const [creating, setCreating] = useState(false);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    async function loadRepositories(token) {
        setLoading(true);
        setError("");

        try {
            const response = await fetch(`${API_URL}/repositories`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Failed to load repositories.");
            }

            setRepositories(data.repositories);
        } catch (err) {
            setError(err.message || "Cannot connect to CodeVault.");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        if (session?.token) {
            loadRepositories(session.token);
        }
    }, [session?.token]);

    function handleLogin(data) {
        localStorage.setItem("codevault_session", JSON.stringify(data));
        setSession(data);
    }

    function handleLogout() {
        localStorage.removeItem("codevault_session");
        setSession(null);
        setRepositories([]);
    }

    async function handleCreateRepository(e) {
        e.preventDefault();
        setCreating(true);
        setError("");
        setMessage("");

        try {
            const response = await fetch(`${API_URL}/repositories`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${session.token}`
                },
                body: JSON.stringify({
                    name: name.trim(),
                    description: description.trim(),
                    visibility
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Could not create repository.");
            }

            setRepositories(prev => [data.repository, ...prev]);
            setName("");
            setDescription("");
            setVisibility("public");
            setShowForm(false);
            setMessage("Repository created successfully.");
        } catch (err) {
            setError(err.message || "Cannot connect to CodeVault.");
        } finally {
            setCreating(false);
        }
    }

    if (!session) {
        return <Login onLogin={handleLogin} />;
    }

    const user = session.user;

    const filteredRepositories = repositories.filter(repo =>
        `${repo.name} ${repo.description}`
            .toLowerCase()
            .includes(search.toLowerCase())
    );

    return (
        <div className="dashboard">
            <header className="topbar">
                <div className="brand">
                    <span className="brand-icon">{"</>"}</span>
                    <span>CodeVault</span>
                </div>

                <input
                    className="search-box"
                    type="text"
                    placeholder="Search repositories..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                />

                <div className="topbar-user">
                    <span className="avatar">
                        {user.username.charAt(0).toUpperCase()}
                    </span>
                    <span>{user.username}</span>
                    <button className="logout-btn" onClick={handleLogout}>
                        Sign out
                    </button>
                </div>
            </header>

            <div className="dashboard-layout">
                <aside className="sidebar">
                    <p className="sidebar-heading">WORKSPACE</p>
                    <div className="sidebar-link active">▦ Dashboard</div>
                    <div className="sidebar-link">▤ Repositories</div>
                    <div className="sidebar-link">⑂ Pull requests</div>
                    <div className="sidebar-link">⚙ Settings</div>

                    <div className="sidebar-profile">
                        <span className="avatar">
                            {user.username.charAt(0).toUpperCase()}
                        </span>
                        <div>
                            <strong>{user.name}</strong>
                            <p>@{user.username}</p>
                        </div>
                    </div>
                </aside>

                <main className="dashboard-main">
                    <div className="welcome-row">
                        <div>
                            <p className="eyebrow">YOUR WORKSPACE</p>
                            <h1>Welcome back, {user.name}!</h1>
                            <p className="muted">
                                Your code journey starts here.
                            </p>
                        </div>

                        <button
                            className="new-repo-btn"
                            onClick={() => {
                                setError("");
                                setMessage("");
                                setShowForm(true);
                            }}
                        >
                            + New repository
                        </button>
                    </div>

                    {message && <p className="status-message">{message}</p>}
                    {error && <p className="error-message">{error}</p>}

                    {showForm && (
                        <section className="repo-form-card">
                            <div className="form-heading">
                                <h2>Create a new repository</h2>
                                <button
                                    className="close-btn"
                                    type="button"
                                    onClick={() => setShowForm(false)}
                                >
                                    ✕
                                </button>
                            </div>

                            <form onSubmit={handleCreateRepository}>
                                <label htmlFor="repo-name">
                                    Repository name
                                </label>
                                <input
                                    id="repo-name"
                                    className="repo-input"
                                    value={name}
                                    onChange={e => setName(e.target.value)}
                                    placeholder="e.g. portfolio-website"
                                    maxLength={100}
                                    required
                                />

                                <label htmlFor="repo-description">
                                    Description (optional)
                                </label>
                                <textarea
                                    id="repo-description"
                                    className="repo-input"
                                    value={description}
                                    onChange={e => setDescription(e.target.value)}
                                    placeholder="What is this project about?"
                                    maxLength={500}
                                    rows={3}
                                />

                                <label htmlFor="repo-visibility">
                                    Visibility
                                </label>
                                <select
                                    id="repo-visibility"
                                    className="repo-input"
                                    value={visibility}
                                    onChange={e => setVisibility(e.target.value)}
                                >
                                    <option value="public">
                                        Public — visible to everyone
                                    </option>
                                    <option value="private">
                                        Private — only you for now
                                    </option>
                                </select>

                                <button
                                    className="new-repo-btn"
                                    type="submit"
                                    disabled={creating}
                                >
                                    {creating ? "Creating..." : "Create repository"}
                                </button>
                            </form>
                        </section>
                    )}

                    <section className="stats-grid">
                        <div className="stat-card">
                            <span className="stat-icon">▤</span>
                            <p>Total repositories</p>
                            <h2>{repositories.length}</h2>
                        </div>

                        <div className="stat-card">
                            <span className="stat-icon">⑂</span>
                            <p>Contributions</p>
                            <h2>0</h2>
                        </div>

                        <div className="stat-card">
                            <span className="stat-icon">☆</span>
                            <p>Starred projects</p>
                            <h2>0</h2>
                        </div>
                    </section>

                    <section className="repositories-section">
                        <div className="section-heading">
                            <div>
                                <h2>Your repositories</h2>
                                <p className="muted">
                                    Projects saved to your CodeVault account.
                                </p>
                            </div>
                        </div>

                        {loading ? (
                            <p className="muted">Loading repositories...</p>
                        ) : filteredRepositories.length > 0 ? (
                            <div className="repository-list">
                                {filteredRepositories.map(repo => (
                                    <article
                                        className="repository-item"
                                        key={repo._id}
                                    >
                                        <div>
                                            <h3>{repo.name}</h3>
                                            <p className="muted">
                                                {repo.description ||
                                                    "No description provided."}
                                            </p>
                                            <span className="visibility-tag">
                                                {repo.visibility}
                                            </span>
                                        </div>
                                        <span className="repo-symbol">{"</>"}</span>
                                    </article>
                                ))}
                            </div>
                        ) : (
                            <div className="empty-state">
                                <div className="empty-icon">{"</>"}</div>
                                <h3>
                                    {search
                                        ? "No matching repositories"
                                        : "Build something amazing"}
                                </h3>
                                <p>
                                    {search
                                        ? "Try another search term."
                                        : "You haven't created any repositories yet. Create your first repository to get started."}
                                </p>
                                {!search && (
                                    <button
                                        className="new-repo-btn"
                                        onClick={() => setShowForm(true)}
                                    >
                                        Create your first repository
                                    </button>
                                )}
                            </div>
                        )}
                    </section>
                </main>
            </div>
        </div>
    );
}
