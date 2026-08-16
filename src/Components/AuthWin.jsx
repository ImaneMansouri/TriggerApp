import { useState } from 'react'
import '../Styles/AuthWin.css'

export function AuthWin(){ 

    // Detect whether user is registering or logging in!
    const [showRegister, setShowRegister] = useState(false)

    let windowClass = 'auth-win'
    if (showRegister){
        windowClass = 'auth-win active'
    }

    // Sign up form data
    const[email, setEmail] = useState('')
    const[password, setPassword] = useState('')

    async function signup(event){
        event.preventDefault()
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const lat = position.coords.latitude
                const lon = position.coords.longitude
                const response = await fetch('http://localhost:5050/api/auth/signup', {
                    method: 'POST',
                    headers: {"Content-Type": "application/json"},
                    body: JSON.stringify({
                        email: email,
                        password: password,
                        lat: lat,
                        lon: lon,})
                    })
                const data = await response.json()
                console.log(data)}, 
            (error) => {console.log(error)}
        )}

    return(
        <div className={windowClass}>
            {/* New Users */}
            <div className="register-form">
                <h1>Register for Free</h1>
                <p>Create an account below</p>
                <form onSubmit = {signup}>
                    <input type = "email"
                        placeholder="email"
                        value = {email}
                        onChange = {(event)=> setEmail(event.target.value)}/>
                    <input type="password"
                        placeholder="password"
                        value = {password}
                        onChange = {(event)=> setPassword(event.target.value)}/>
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