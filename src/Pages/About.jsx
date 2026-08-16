import { Header } from '../Components/Header.jsx'
import { Footer } from '../Components/Footer.jsx'
import '../Styles/Login.css'

export function About() {
    return(
        <div className="login-page">
            <Header/>
            <div className="login-main">
                <p>By Imane Mansouri, Aya Cherkaoui, Paige Hoffman for CS Girlies 2026 Hackathon!</p>
                <Footer/>
            </div>
        </div  >
    );
}