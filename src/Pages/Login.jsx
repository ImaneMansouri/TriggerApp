import { Header } from '../Components/Header.jsx'
import { AuthWin } from '../Components/AuthWin.jsx'
import { Footer } from '../Components/Footer.jsx'
import '../Styles/Login.css'

export function Login() {
    return(
        <div className="login-page">
            <Header/>
            <main className="login-main">
                <AuthWin/>
            </main>
            <Footer/>
        </div>
    );
}
