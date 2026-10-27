
import { useState } from "react";
import "./App.css";

function App() {
    const [form, setForm] = useState({
        name: "",
        username: "",
        email: "",
        password: ""
    });

    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    function handleChange(e) {
        setForm({
            ...form,
            [e.target.name]: e.target.value
        });
    }

    async function handleSubmit(e) {
        e.preventDefault();

        setMessage("");
        setError("");
        setLoading(true);

        try {
            const res = await fetch(
                "http://localhost:5000/api/auth/register",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify(form)
                }
            );

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.message || "Registration failed");
            }

            setMessage(data.message);

            setForm({
                name: "",
                username: "",
                email: "",
                password: ""
            });
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="app">
            <nav className="navbar">
                <h2>CodeVault</h2>
                <span>Developer Platform</span>
            </nav>

            <main className="main">
                <h1>Create your account</h1>
                <p>Join CodeVault and start building.</p>

                <form className="register-form" onSubmit={handleSubmit}>
                    <label>Full name</label>
                    <input
                        name="name"
                        value={form.name}
                        onChange={handleChange}
                        placeholder="Enter your name"
                        required
                    />

                    <label>Username</label>
                    <input
                        name="username"
                        value={form.username}
                        onChange={handleChange}
                        placeholder="Choose a username"
                        minLength={3}
                        maxLength={30}
                        pattern="[a-zA-Z0-9_-]{3,30}"
                        required
                    />

                    <label>Email</label>
                    <input
                        type="email"
                        name="email"
                        value={form.email}
                        onChange={handleChange}
                        placeholder="you@example.com"
                        required
                    />

                    <label>Password</label>
                    <input
                        type="password"
                        name="password"
                        value={form.password}
                        onChange={handleChange}
                        placeholder="At least 8 characters"
                        minLength={8}
                        required
                    />

                    <button type="submit" disabled={loading}>
                        {loading ? "Creating account..." : "Create account"}
                    </button>

                    {message && <p className="success">{message}</p>}
                    {error && <p className="error">{error}</p>}
                </form>
            </main>
        </div>
    );
}

export default App;
