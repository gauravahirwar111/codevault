import { useState } from "react";
import "./Login.css";

export default function Login({ onLogin }) {
    const [identifier, setIdentifier] = useState("");
    const [password, setPassword] = useState("");
    const [message, setMessage] = useState("");
    const [error, setError] = useState(false);
    const [loading, setLoading] = useState(false);

    async function handleSubmit(e) {
        e.preventDefault();

        setMessage("");
        setError(false);
        setLoading(true);

        try {
            const response = await fetch(
                "http://localhost:5000/api/auth/login",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        identifier: identifier.trim(),
                        password
                    })
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Login failed");
            }

            onLogin({
                token: data.token,
                user: data.user
            });

            setMessage("Login successful!");
            setPassword("");
        } catch (err) {
    console.error("Login request failed:", err);
    setError(true);
    setMessage(
        err instanceof TypeError
            ? "Network error. Check the browser Console for details."
            : err.message
    );
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="login-page">
            <div className="login-card">
                <div className="login-logo">{"</>"}</div>

                <h1>Welcome back</h1>
                <p className="login-subtitle">
                    Sign in to continue to CodeVault
                </p>

                <form onSubmit={handleSubmit}>
                    <label htmlFor="identifier">
                        Username or email
                    </label>
                    <input
                        id="identifier"
                        type="text"
                        placeholder="Enter your username or email"
                        value={identifier}
                        onChange={(e) => setIdentifier(e.target.value)}
                        autoComplete="username"
                        required
                    />

                    <label htmlFor="password">Password</label>
                    <input
                        id="password"
                        type="password"
                        placeholder="Enter your password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        autoComplete="current-password"
                        required
                    />

                    <button type="submit" disabled={loading}>
                        {loading ? "Signing in..." : "Sign in"}
                    </button>
                </form>

                {message && (
                    <p
                        className={`login-message ${
                            error ? "error" : "success"
                        }`}
                        role="status"
                    >
                        {message}
                    </p>
                )}

                <p className="login-footer">
                    Your code. Your repositories. Your workspace.
                </p>
            </div>
        </div>
    );
}