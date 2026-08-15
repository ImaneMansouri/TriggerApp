import { useState } from 'react'
import '../Styles/AuthWin.css'

export function AuthWin(){ 
    const [showRegister, setShowRegister] = useState(false)

    let windowClass = 'auth-win'
    if (showRegister){
        windowClass = 'auth-win active'
    }

    return(
        <div className={windowClass}>
            {/* New Users */}
            <div className="register-form">
                <h1>Register for Free</h1>
                <p>Create an account below</p>
                <form>
                    <input type = "email"
                        placeholder="email"/>
                    <input type="password"
                        placeholder="password"/>
                    <button type="submit">Sign up</button>
                </form>
            </div>

            {/* Returning Users */}
            <div className="login-form">
                <h1>Welcome Back</h1>
                <p>Log in to continue</p>
                <form>
                    <input type = "email"
                        placeholder="email"/>
                    <input type="password"
                        placeholder="password"/>
                    <a href='#'>Forgot password?</a>
                    <button type="submit">Log In</button>
                </form>
            </div>

            {/* Switch Panel */}
            <div className="panel">
                {showRegister ? (
                    <div className="to-right">
                        <h1>Sign Up</h1>
                        <p>Join for free today</p>
                        <button 
                            type="button"
                            onClick={() => setShowRegister(false)}>
                            Sign Up
                        </button>
                    </div>
                ) : (
                    <div className="to-left">
                        <h1>Log In</h1>
                        <p>Already have an account?</p>
                        <button 
                            type="button"
                            onClick={() => setShowRegister(true)}>
                            Log In
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}