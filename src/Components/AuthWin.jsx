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
        //stops form from refreshing page or doing anything goofy
        event.preventDefault()
        //grabs location if user approves through browser
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const lat = position.coords.latitude
                const lon = position.coords.longitude

                //sends sign up form info to backend
                const response = await fetch('http://localhost:5050/api/auth/signup', {
                    method: 'POST',
                    headers: {"Content-Type": "application/json"},
                    body: JSON.stringify({
                        email: email,
                        password: password,
                        lat: lat,
                        lon: lon,})
                    })
                    //turn backend response into JS object
                const data = await response.json()

                //checks successful signup
                if (!response.ok){
                    console.log(data.error)
                    return
                }
                
                //save token in browser
                localStorage.setItem('token', data.token)

                console.log(data.user)}, 
            //error if user rejects location request
            (error) => {console.log(error)}
        )}

    // Login form data
    const[loginEmail, setLoginEmail] = useState('')
    const[loginPassword, setLoginPassword] = useState('')

    async function login(event){
        event.preventDefault()

        const response = await fetch(
            'http://localhost:5050/api/auth/login',
            {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({
                    email: loginEmail,
                    password: loginPassword
                })
            }
        )

        const data = await response.json()
        if(!response.ok){
            console.log(data.error)
            return
        }
        localStorage.setItem('token', data.token)
        console.log(data.user)
    }

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
                <form onSubmit = {login}>
                    <input type = "email"
                        placeholder="email"
                        value={loginEmail}
                        onChange={(event) => setLoginEmail(event.target.value)}/>
                    <input type="password"
                        placeholder="password"
                        value={loginPassword}
                        onChange={(event) => setLoginPassword(event.target.value)}/>
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