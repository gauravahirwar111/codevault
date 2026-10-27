
import { useEffect, useState } from "react";
import "./App.css";

function App() {
    const [message, setMessage] = useState("Connecting...");
    const [error, setError] = useState("");

    useEffect(() => {
        fetch("http://localhost:5000/api/health")
            .then((res) => {
                if (!res.ok) {
                    throw new Error("Backend request failed");
                }
                return res.json();
            })
            .then((data) => {
                setMessage(data.message);
            })
            .catch(() => {
                setError("Cannot connect to backend");
            });
    }, []);

    return (
        <div className="app">
            <nav className="navbar">
                <h2>CodeVault</h2>
                <span>Developer Platform</span>
            </nav>

            <main className="main">
                <h1>Build. Commit. Collaborate.</h1>
                <p>
                    Your code deserves a home.
                    Create repositories and collaborate with developers.
                </p>

                <div className="status">
                    <h3>Backend Connection</h3>

                    {error ? (
                        <p className="error">{error}</p>
                    ) : (
                        <p className="success">{message}</p>
                    )}
                </div>
            </main>
        </div>
    );
}

export default App;
